'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMenuItemById, updateMenuItem } from '@/services/menu-items.service';
import { getTaxRates } from '@/services/tax-rates.service';
import { apiClient } from '@/services/api-client';
import type { MenuItem, DietaryType, FoodType, MenuItemStatus, TaxRate } from '@/types/menu';
import type { Ingredient, MenuItemRecipe } from '@/types/inventory';

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
    if (!name.trim() || !code.trim() || !price) { setError('Name, code and price are required'); return; }
    setIsSubmitting(true); setError('');
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

  const fieldCls = 'mt-1 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] placeholder-[#9AA6B2]/50 focus:border-[#2AFEB7] focus:outline-none';
  const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]';

  if (isLoading) {
    return <div className="rounded-xl border border-[#26313C] bg-[#111820] p-8 text-center text-[#9AA6B2]">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 font-sans">
      <div>
        <button type="button" onClick={() => router.back()} className="mb-2 text-xs text-[#9AA6B2] hover:text-[#2AFEB7]">← Back</button>
        <h1 className="text-3xl font-bold text-[#F5F7FA]">Edit Menu Item & Recipe</h1>
        <p className="mt-1 text-sm text-[#9AA6B2]">
          {item?.category?.name && <><span className="text-[#F5F7FA]">{item.category.name}</span> → </>}
          <span className="font-semibold text-[#F5F7FA]">{item?.name}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-[#26313C] bg-[#111820] p-6 shadow-xl">
        {error && (
          <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">{error}</div>
        )}

        {/* Basic details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className={labelCls}>Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={fieldCls} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={labelCls}>Code *</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className={`${fieldCls} font-mono`} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className={`${fieldCls} resize-none`} placeholder="Describe this item..." />
        </div>

        <div>
          <label className={labelCls}>Image URL</label>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className={fieldCls} />
        </div>

        {/* Pricing & types */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Price (₹) *</label>
            <input type="number" step="0.01" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Dietary Type</label>
            <select value={dietaryType} onChange={(e) => setDietaryType(e.target.value as DietaryType)} className={fieldCls}>
              <option value="VEG">🟢 VEG</option>
              <option value="NON_VEG">🔴 NON-VEG</option>
              <option value="EGG">🟡 EGG</option>
              <option value="VEGAN">🌿 VEGAN</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Food Type</label>
            <select value={foodType} onChange={(e) => setFoodType(e.target.value as FoodType)} className={fieldCls}>
              <option value="FOOD">🍽️ FOOD</option>
              <option value="BEVERAGE">🥤 BEVERAGE</option>
              <option value="DESSERT">🍰 DESSERT</option>
              <option value="OTHER">📦 OTHER</option>
            </select>
          </div>
        </div>

        {/* Tax, prep time, position, status */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="col-span-2">
            <label className={labelCls}>Tax Rate</label>
            <select value={taxRateId} onChange={(e) => setTaxRateId(e.target.value)} className={fieldCls}>
              <option value="">— No tax —</option>
              {taxRates.filter((t) => t.status === 'ACTIVE').map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.value}{t.type === 'PERCENTAGE' ? '%' : ' flat'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Prep Time (min)</label>
            <input type="number" min={0} max={1440} value={prepTime} onChange={(e) => setPrepTime(e.target.value)} placeholder="e.g. 15" className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Position</label>
            <input type="number" min={0} value={position} onChange={(e) => setPosition(e.target.value)} className={fieldCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as MenuItemStatus)} className={fieldCls}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        {/* [V2 FEATURE - INVENTORY RECIPE & INGREDIENT DEDUCTIONS SECTION (Commented out for V1)] */}
        {/*
        <div className="rounded-xl border border-[#2AFEB7]/30 bg-[#18212B] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🥫</span>
              <h3 className="text-sm font-bold text-white">Raw Ingredients Recipe (Auto-Deductions)</h3>
            </div>
            <span className="text-[10px] font-mono text-[#2AFEB7] bg-[#2AFEB7]/10 px-2 py-0.5 rounded-md border border-[#2AFEB7]/20">
              {recipeIngredients.filter((r) => r.ingredientId).length} Ingredients Linked
            </span>
          </div>
          <p className="text-xs text-[#9AA6B2]">
            Whenever this dish is ordered by a customer or cashier, Atlas will automatically calculate and deduct these ingredient quantities from raw stock.
          </p>

          <div className="space-y-2 pt-2">
            {recipeIngredients.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-[#111820] rounded-xl border border-[#26313C]">
                <select
                  value={row.ingredientId}
                  onChange={(e) => {
                    const updated = [...recipeIngredients];
                    updated[idx].ingredientId = e.target.value;
                    setRecipeIngredients(updated);
                  }}
                  className="flex-1 rounded-lg border border-[#26313C] bg-[#0B0F14] px-3 py-1.5 text-xs text-white focus:border-[#2AFEB7] focus:outline-none"
                >
                  <option value="">Select raw ingredient...</option>
                  {availableIngredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.unitOfMeasure})
                    </option>
                  ))}
                </select>

                <div className="w-32">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Quantity"
                    value={row.quantityRequired}
                    onChange={(e) => {
                      const updated = [...recipeIngredients];
                      updated[idx].quantityRequired = parseFloat(e.target.value) || 0;
                      setRecipeIngredients(updated);
                    }}
                    className="w-full rounded-lg border border-[#26313C] bg-[#0B0F14] px-3 py-1.5 text-xs text-white focus:border-[#2AFEB7] focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setRecipeIngredients(recipeIngredients.filter((_, i) => i !== idx))}
                  className="text-[#EF4444] hover:text-red-300 p-1.5 text-sm"
                  title="Remove ingredient"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setRecipeIngredients([...recipeIngredients, { ingredientId: '', quantityRequired: 100 }])}
              className="w-full py-2 border border-dashed border-[#26313C] hover:border-[#2AFEB7] text-[#2AFEB7] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <span>➕</span> Add Ingredient to Recipe
            </button>
          </div>
        </div>
        */}

        <div className="flex justify-end gap-3 border-t border-[#26313C] pt-4">
          <button type="button" onClick={() => router.back()} disabled={isSubmitting}
            className="rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2 text-xs font-semibold text-[#F5F7FA] hover:border-[#2AFEB7] disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            className="rounded-lg bg-[#2AFEB7] px-5 py-2 text-xs font-bold text-[#0B0F14] hover:bg-[#22E5A4] disabled:opacity-50 shadow">
            {isSubmitting ? 'Saving...' : 'Update Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
