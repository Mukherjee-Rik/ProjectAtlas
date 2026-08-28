'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMenuItemById, updateMenuItem } from '@/services/menu-items.service';
import { getTaxRates } from '@/services/tax-rates.service';
import { apiClient } from '@/services/api-client';
import type { MenuItem, DietaryType, FoodType, MenuItemStatus, TaxRate } from '@/types/menu';
import type { Ingredient, MenuItemRecipe } from '@/types/inventory';
import { ValidatedInput, ValidatedTextarea, ValidatedSelect } from '@/components/ui/validated-input';
import { validateText, validateCode, validateNumber } from '@/lib/validation';

export default function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [item, setItem] = useState<MenuItem | null>(null);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<
    { ingredientId: string; quantityRequired: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('');
  const [dietaryType, setDietaryType] = useState<DietaryType>('VEG');
  const [foodType, setFoodType] = useState<FoodType>('FOOD');
  const [prepTime, setPrepTime] = useState('');
  const [taxRateId, setTaxRateId] = useState('');
  const [position, setPosition] = useState('0');
  const [status, setStatus] = useState<MenuItemStatus>('ACTIVE');

  const [errors, setErrors] = useState<{
    name?: string;
    code?: string;
    price?: string;
    prepTime?: string;
    description?: string;
  }>({});

  const validateField = (field: string, val: any) => {
    const nextErrors = { ...errors };

    switch (field) {
      case 'name': {
        const res = validateText(val, 'Item name', 2, 100);
        if (!res.isValid) nextErrors.name = res.error;
        else delete nextErrors.name;
        break;
      }

      case 'code': {
        const res = validateCode(val, 2, 20, 'Item code');
        if (!res.isValid) nextErrors.code = res.error;
        else delete nextErrors.code;
        break;
      }

      case 'price': {
        const res = validateNumber(val, 'Price', 0.01, 1000000, false);
        if (!res.isValid) nextErrors.price = res.error;
        else delete nextErrors.price;
        break;
      }

      case 'prepTime': {
        if (val) {
          const res = validateNumber(val, 'Preparation time', 0, 300, true, false);
          if (!res.isValid) nextErrors.prepTime = res.error;
          else delete nextErrors.prepTime;
        } else {
          delete nextErrors.prepTime;
        }
        break;
      }

      case 'description': {
        if (val && val.length > 500) {
          nextErrors.description = 'Description cannot exceed 500 characters';
        } else {
          delete nextErrors.description;
        }
        break;
      }
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const load = useCallback(async () => {
    try {
      const [itemRes, taxRes, ingRes, recRes] = await Promise.all([
        getMenuItemById(id),
        getTaxRates(),
        apiClient.get<{ data: { ingredients: Ingredient[] } } | Ingredient[]>('/inventory/overview').catch(() => ({ data: { ingredients: [] } })),
        apiClient.get<{ data: MenuItemRecipe[] } | MenuItemRecipe[]>('/inventory/recipes').catch(() => ({ data: [] })),
      ]);

      const i = itemRes.data;
      setItem(i);
      setName(i.name);
      setCode(i.code);
      setDescription(i.description ?? '');
      setImageUrl(i.imageUrl ?? '');
      setPrice(String(i.price));
      setDietaryType(i.dietaryType);
      setFoodType(i.foodType);
      setPrepTime(i.preparationTimeMinutes != null ? String(i.preparationTimeMinutes) : '');
      setTaxRateId(i.taxRateId ?? '');
      setPosition(String(i.position));
      setStatus(i.status);
      setTaxRates((taxRes as any).data ?? []);

      // Parse ingredients
      const rawIngs = (ingRes as any)?.data?.ingredients || (Array.isArray(ingRes) ? ingRes : []);
      setAvailableIngredients(rawIngs);

      // Parse item recipe
      const rawRecs = (recRes as any)?.data || (Array.isArray(recRes) ? recRes : []);
      if (Array.isArray(rawRecs)) {
        const itemRecipe = rawRecs.find((r: MenuItemRecipe) => r.menuItemId === id);
        if (itemRecipe && itemRecipe.recipe && Array.isArray(itemRecipe.recipe.ingredients)) {
          setRecipeIngredients(
            itemRecipe.recipe.ingredients.map((ri: any) => ({
              ingredientId: ri.ingredientId,
              quantityRequired: ri.quantityRequired,
            })),
          );
        }
      }
    } catch {
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => { void load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameRes = validateText(name, 'Item name', 2, 100);
    const codeRes = validateCode(code, 2, 20, 'Item code');
    const priceRes = validateNumber(price, 'Price', 0.01, 1000000, false);
    const prepRes = prepTime ? validateNumber(prepTime, 'Prep time', 0, 300, true, false) : { isValid: true };

    const validationErrors: typeof errors = {};
    if (!nameRes.isValid) validationErrors.name = nameRes.error;
    if (!codeRes.isValid) validationErrors.code = codeRes.error;
    if (!priceRes.isValid) validationErrors.price = priceRes.error;
    if (!prepRes.isValid) validationErrors.prepTime = prepRes.error;
    if (description && description.length > 500) validationErrors.description = 'Description cannot exceed 500 characters';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setError('Please resolve the highlighted errors before saving.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setErrors({});

    try {
      // 1. Update menu item properties
      await updateMenuItem(id, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        price: Number(price),
        dietaryType,
        foodType,
        preparationTimeMinutes: prepTime ? Number(prepTime) : undefined,
        taxRateId: taxRateId || undefined,
        position: Number(position),
        status,
      });

      // 2. Save recipe ingredients (auto-deductions)
      const validIngredients = recipeIngredients.filter(
        (i) => i.ingredientId && i.quantityRequired > 0,
      );
      await apiClient.post('/inventory/recipes', {
        menuItemId: id,
        ingredients: validIngredients,
      });

      // Navigate back to menu detail (via category → menu chain)
      if (item?.category?.menuId) {
        router.push(`/menus/${item.category.menuId}`);
      } else {
        router.back();
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update item');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Loading item details...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 font-sans">
      <div>
        <button type="button" onClick={() => router.back()} className="mb-2 text-xs text-muted-foreground hover:text-primary">← Back</button>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">Edit Menu Item & Recipe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {item?.category?.name && <><span className="text-foreground">{item.category.name}</span> → </>}
          <span className="font-semibold text-foreground">{item?.name}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-card p-6" noValidate>
        {error && (
          <div className="rounded-lg border border-atlas-error/40 bg-atlas-error/10 p-3 text-xs text-atlas-error animate-in fade-in">{error}</div>
        )}

        {/* Basic details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <ValidatedInput
              label="Item Name"
              required
              maxLength={100}
              showCount
              placeholder="e.g. Chicken Biryani"
              value={name}
              error={errors.name}
              onChange={(e) => {
                setName(e.target.value);
                validateField('name', e.target.value);
              }}
              onBlur={(e) => validateField('name', e.target.value)}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <ValidatedInput
              label="Item Code / SKU"
              required
              maxLength={20}
              uppercase
              showCount
              placeholder="e.g. BIRY-01"
              value={code}
              error={errors.code}
              helperText="2-20 chars alphanumeric"
              onChange={(e) => {
                setCode(e.target.value);
                validateField('code', e.target.value);
              }}
              onBlur={(e) => validateField('code', e.target.value)}
            />
          </div>
        </div>

        <ValidatedTextarea
          label="Description"
          maxLength={500}
          showCount
          rows={3}
          placeholder="Describe the dish ingredients, flavor, or serving style..."
          value={description}
          error={errors.description}
          onChange={(e) => {
            setDescription(e.target.value);
            validateField('description', e.target.value);
          }}
          onBlur={(e) => validateField('description', e.target.value)}
        />

        <ValidatedInput
          label="Image URL"
          maxLength={500}
          placeholder="https://images.unsplash.com/..."
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        {/* Pricing & types */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <ValidatedInput
            label="Price (₹)"
            required
            type="number"
            step="0.01"
            min={0.01}
            max={1000000}
            placeholder="e.g. 299.00"
            value={price}
            error={errors.price}
            onChange={(e) => {
              setPrice(e.target.value);
              validateField('price', e.target.value);
            }}
            onBlur={(e) => validateField('price', e.target.value)}
          />

          <ValidatedSelect
            label="Dietary Type"
            value={dietaryType}
            onChange={(e) => setDietaryType(e.target.value as DietaryType)}
          >
            <option value="VEG">🟢 VEG</option>
            <option value="NON_VEG">🔴 NON-VEG</option>
            <option value="EGG">🟡 EGG</option>
            <option value="VEGAN">🌿 VEGAN</option>
          </ValidatedSelect>

          <ValidatedSelect
            label="Food Type"
            value={foodType}
            onChange={(e) => setFoodType(e.target.value as FoodType)}
          >
            <option value="FOOD">🍽️ FOOD</option>
            <option value="BEVERAGE">🥤 BEVERAGE</option>
            <option value="DESSERT">🍰 DESSERT</option>
            <option value="OTHER">📦 OTHER</option>
          </ValidatedSelect>
        </div>

        {/* Tax, prep time, position, status */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="col-span-2">
            <ValidatedSelect
              label="Tax Rate"
              value={taxRateId}
              onChange={(e) => setTaxRateId(e.target.value)}
            >
              <option value="">— No tax —</option>
              {taxRates.filter((t) => t.status === 'ACTIVE').map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.value}{t.type === 'PERCENTAGE' ? '%' : ' flat'})
                </option>
              ))}
            </ValidatedSelect>
          </div>

          <ValidatedInput
            label="Prep Time (min)"
            type="number"
            min={0}
            max={300}
            placeholder="e.g. 15"
            value={prepTime}
            error={errors.prepTime}
            onChange={(e) => {
              setPrepTime(e.target.value);
              validateField('prepTime', e.target.value);
            }}
            onBlur={(e) => validateField('prepTime', e.target.value)}
          />

          <ValidatedInput
            label="Sort Position"
            type="number"
            min={0}
            max={9999}
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
        </div>

        <ValidatedSelect
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as MenuItemStatus)}
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </ValidatedSelect>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button type="button" onClick={() => router.back()} disabled={isSubmitting}
            className="rounded-lg border border-border bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:border-primary disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-background hover:bg-primary-hover disabled:opacity-50 shadow">
            {isSubmitting ? 'Saving...' : 'Update Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
