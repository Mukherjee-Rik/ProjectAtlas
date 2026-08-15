'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMenuById } from '@/services/menus.service';
import {
  getMenuCategories, createMenuCategory, updateMenuCategory, deleteMenuCategory,
} from '@/services/menu-categories.service';
import {
  getMenuItems, createMenuItem, deleteMenuItem,
} from '@/services/menu-items.service';
import { apiClient } from '@/services/api-client';
import type { Menu, MenuCategory, MenuItem } from '@/types/menu';
import type { Ingredient, MenuItemRecipe } from '@/types/inventory';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const DIETARY_DOT: Record<string, string> = { VEG: '#22C55E', VEGAN: '#22C55E', EGG: '#EAB308', NON_VEG: '#EF4444' };

function formatCurrency(n: number) {
  return `₹${Number(n).toFixed(2)}`;
}

export default function MenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [menu, setMenu] = useState<Menu | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, MenuItem[]>>({});
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [recipesMap, setRecipesMap] = useState<Record<string, MenuItemRecipe>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Category inline form
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catPos, setCatPos] = useState('0');
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState('');
  const [editingCat, setEditingCat] = useState<MenuCategory | null>(null);
  const [deletingCat, setDeletingCat] = useState<MenuCategory | null>(null);
  const [isDeletingCat, setIsDeletingCat] = useState(false);

  // Item inline form per category
  const [addItemCatId, setAddItemCatId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDietary, setItemDietary] = useState<'VEG' | 'NON_VEG' | 'EGG' | 'VEGAN'>('VEG');
  const [itemSaving, setItemSaving] = useState(false);
  const [itemError, setItemError] = useState('');
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // Item Recipe Form (Auto-Deductions)
  const [showRecipeSection, setShowRecipeSection] = useState(false);
  const [newItemIngredients, setNewItemIngredients] = useState<
    { ingredientId: string; quantityRequired: number }[]
  >([]);

  // Quick Recipe Modal for existing items
  const [quickRecipeItem, setQuickRecipeItem] = useState<MenuItem | null>(null);
  const [quickRecipeIngredients, setQuickRecipeIngredients] = useState<
    { ingredientId: string; quantityRequired: number }[]
  >([]);
  const [quickRecipeSaving, setQuickRecipeSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [menuRes, catsRes, ingRes, recRes] = await Promise.all([
        getMenuById(id),
        getMenuCategories(id),
        apiClient.get<{ data: { ingredients: Ingredient[] } } | Ingredient[]>('/inventory/overview').catch(() => ({ data: { ingredients: [] } })),
        apiClient.get<{ data: MenuItemRecipe[] } | MenuItemRecipe[]>('/inventory/recipes').catch(() => ({ data: [] })),
      ]);

      setMenu(menuRes.data);
      const cats = catsRes.data ?? [];
      setCategories(cats);

      // Parse ingredients
      const rawIngs = (ingRes as any)?.data?.ingredients || (Array.isArray(ingRes) ? ingRes : []);
      setAvailableIngredients(rawIngs);

      // Parse recipes
      const rawRecs = (recRes as any)?.data || (Array.isArray(recRes) ? recRes : []);
      const rMap: Record<string, MenuItemRecipe> = {};
      if (Array.isArray(rawRecs)) {
        rawRecs.forEach((r: MenuItemRecipe) => {
          rMap[r.menuItemId] = r;
        });
      }
      setRecipesMap(rMap);

      const itemsMap: Record<string, MenuItem[]> = {};
      await Promise.all(cats.map(async (cat) => {
        try {
          const res = await getMenuItems(cat.id);
          itemsMap[cat.id] = res.data ?? [];
        } catch { itemsMap[cat.id] = []; }
      }));
      setItemsByCategory(itemsMap);
    } catch {
      router.push('/menus');
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => { void loadAll(); }, [loadAll]);

  const openCatForm = (cat?: MenuCategory) => {
    if (cat) {
      setEditingCat(cat);
      setCatName(cat.name);
      setCatCode(cat.code);
      setCatPos(String(cat.position));
    } else {
      setEditingCat(null);
      setCatName(''); setCatCode(''); setCatPos(String(categories.length));
    }
    setCatError('');
    setShowCatForm(true);
  };

  const saveCat = async () => {
    if (!catName.trim() || !catCode.trim()) { setCatError('Name and code are required'); return; }
    setCatSaving(true); setCatError('');
    try {
      if (editingCat) {
        await updateMenuCategory(editingCat.id, { name: catName.trim(), code: catCode.trim().toUpperCase(), position: Number(catPos) });
      } else {
        await createMenuCategory({ menuId: id, name: catName.trim(), code: catCode.trim().toUpperCase(), position: Number(catPos) });
      }
      setShowCatForm(false);
      await loadAll();
    } catch (err: any) {
      setCatError(err?.message ?? 'Failed to save category');
    } finally {
      setCatSaving(false);
    }
  };

  const confirmDeleteCat = async () => {
    if (!deletingCat) return;
    setIsDeletingCat(true);
    try {
      await deleteMenuCategory(deletingCat.id);
      setDeletingCat(null);
      await loadAll();
    } catch (err: any) {
      alert(err?.message ?? 'Failed to delete category');
    } finally {
      setIsDeletingCat(false);
    }
  };

  const openItemForm = (catId: string) => {
    setAddItemCatId(catId);
    setItemName('');
    setItemCode('');
    setItemPrice('');
    setItemDietary('VEG');
    setItemError('');
    setShowRecipeSection(false);
    setNewItemIngredients([{ ingredientId: '', quantityRequired: 100 }]);
  };

  const saveItem = async (catId: string) => {
    if (!itemName.trim() || !itemCode.trim() || !itemPrice) {
      setItemError('Name, code, and price are required');
      return;
    }
    setItemSaving(true);
    setItemError('');
    try {
      // 1. Create the menu item
      const createdItem = await createMenuItem({
        categoryId: catId,
        name: itemName.trim(),
        code: itemCode.trim().toUpperCase(),
        price: Number(itemPrice),
        dietaryType: itemDietary,
      });

      // 2. If recipe ingredients are configured, automatically save recipe!
      const validIngredients = newItemIngredients.filter(
        (i) => i.ingredientId && i.quantityRequired > 0,
      );
      if (createdItem.data?.id && validIngredients.length > 0) {
        try {
          await apiClient.post('/inventory/recipes', {
            menuItemId: createdItem.data.id,
            ingredients: validIngredients,
          });
        } catch (rErr) {
          console.warn('Could not auto-map recipe:', rErr);
        }
      }

      setAddItemCatId(null);
      await loadAll();
    } catch (err: any) {
      setItemError(err?.message ?? 'Failed to save item');
    } finally {
      setItemSaving(false);
    }
  };

  const confirmDeleteItem = async () => {
    if (!deletingItem) return;
    setIsDeletingItem(true);
    try {
      await deleteMenuItem(deletingItem.id);
      setDeletingItem(null);
      await loadAll();
    } catch (err: any) {
      alert(err?.message ?? 'Failed to delete item');
    } finally {
      setIsDeletingItem(false);
    }
  };

  const openQuickRecipeModal = (item: MenuItem) => {
    setQuickRecipeItem(item);
    const existing = recipesMap[item.id];
    if (existing && existing.recipe && existing.recipe.ingredients.length > 0) {
      setQuickRecipeIngredients(
        existing.recipe.ingredients.map((ri) => ({
          ingredientId: ri.ingredientId,
          quantityRequired: ri.quantityRequired,
        })),
      );
    } else {
      setQuickRecipeIngredients([{ ingredientId: '', quantityRequired: 100 }]);
    }
  };

  const saveQuickRecipe = async () => {
    if (!quickRecipeItem) return;
    setQuickRecipeSaving(true);
    try {
      const validIngredients = quickRecipeIngredients.filter(
        (i) => i.ingredientId && i.quantityRequired > 0,
      );
      await apiClient.post('/inventory/recipes', {
        menuItemId: quickRecipeItem.id,
        ingredients: validIngredients,
      });
      setQuickRecipeItem(null);
      await loadAll();
    } catch (err: any) {
      alert(err?.message || 'Failed to update recipe');
    } finally {
      setQuickRecipeSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-[#18212B]" />
        <div className="h-40 rounded-xl bg-[#111820]" />
        <div className="h-64 rounded-xl bg-[#111820]" />
      </div>
    );
  }

  if (!menu) return null;

  return (
    <div className="space-y-6 max-w-6xl font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button type="button" onClick={() => router.push('/menus')} className="mb-2 text-xs text-[#9AA6B2] hover:text-[#2AFEB7]">
            ← Back to Menus
          </button>
          <h1 className="text-3xl font-bold text-[#F5F7FA]">{menu.name}</h1>
          <div className="mt-1 flex items-center gap-3">
            <span className="font-mono text-sm text-[#2AFEB7]">{menu.code}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${menu.status === 'ACTIVE' ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30' : 'bg-[#9AA6B2]/15 text-[#9AA6B2] border-[#9AA6B2]/30'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${menu.status === 'ACTIVE' ? 'bg-[#22C55E]' : 'bg-[#9AA6B2]'}`} />
              {menu.status}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/menus/${id}/edit`)}
          className="rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-2 text-xs font-semibold text-[#F5F7FA] hover:border-[#2AFEB7]"
        >
          Edit Menu
        </button>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#F5F7FA]">Categories</h2>
          <button
            type="button"
            onClick={() => openCatForm()}
            className="rounded-lg bg-[#2AFEB7] px-3 py-2 text-xs font-semibold text-[#0B0F14] hover:bg-[#22E5A4]"
          >
            + Add Category
          </button>
        </div>

        {/* Inline category form */}
        {showCatForm && (
          <div className="rounded-xl border border-[#2AFEB7]/30 bg-[#111820] p-4 space-y-3">
            <h3 className="text-sm font-bold text-[#F5F7FA]">{editingCat ? 'Edit Category' : 'New Category'}</h3>
            {catError && <p className="text-xs text-[#EF4444]">{catError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#9AA6B2]">Name *</label>
                <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Starters"
                  className="mt-1 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-2 text-xs text-[#F5F7FA] focus:border-[#2AFEB7] focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#9AA6B2]">Code *</label>
                <input value={catCode} onChange={(e) => setCatCode(e.target.value.toUpperCase())} placeholder="e.g. STARTERS"
                  className="mt-1 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-2 text-xs font-mono text-[#F5F7FA] focus:border-[#2AFEB7] focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#9AA6B2]">Position</label>
                <input type="number" value={catPos} onChange={(e) => setCatPos(e.target.value)} min={0}
                  className="mt-1 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-2 text-xs text-[#F5F7FA] focus:border-[#2AFEB7] focus:outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCatForm(false)} disabled={catSaving}
                className="rounded-lg border border-[#26313C] px-3 py-1.5 text-xs text-[#9AA6B2] hover:border-[#2AFEB7] disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={saveCat} disabled={catSaving}
                className="rounded-lg bg-[#2AFEB7] px-3 py-1.5 text-xs font-semibold text-[#0B0F14] hover:bg-[#22E5A4] disabled:opacity-50">
                {catSaving ? 'Saving...' : editingCat ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        )}

        {categories.length === 0 && !showCatForm && (
          <div className="rounded-xl border border-[#26313C] bg-[#111820] p-8 text-center text-sm text-[#9AA6B2]">
            No categories yet. Add your first category to start building the menu.
          </div>
        )}

        {categories.map((cat) => {
          const items = itemsByCategory[cat.id] ?? [];
          return (
            <div key={cat.id} className="rounded-xl border border-[#26313C] bg-[#111820] overflow-hidden">
              {/* Category header */}
              <div className="flex items-center justify-between border-b border-[#26313C] bg-[#18212B] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#F5F7FA]">{cat.name}</span>
                  <span className="font-mono text-xs text-[#2AFEB7]">{cat.code}</span>
                  <span className="text-xs text-[#9AA6B2]">pos {cat.position}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${cat.status === 'ACTIVE' ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30' : 'bg-[#9AA6B2]/15 text-[#9AA6B2] border-[#9AA6B2]/30'}`}>
                    {cat.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => openCatForm(cat)}
                    className="rounded border border-[#26313C] px-2 py-1 text-[10px] text-[#9AA6B2] hover:border-[#2AFEB7] hover:text-[#2AFEB7]">Edit</button>
                  <button type="button" onClick={() => setDeletingCat(cat)}
                    className="rounded border border-[#EF4444]/30 px-2 py-1 text-[10px] text-[#EF4444] hover:bg-[#EF4444]/10">Delete</button>
                </div>
              </div>

              {/* Items list */}
              <div className="p-3 space-y-2">
                {items.map((item) => {
                  const recipeData = recipesMap[item.id];
                  const hasRecipe = Boolean(recipeData && recipeData.hasRecipe && recipeData.recipe?.ingredients?.length);
                  const ingCount = recipeData?.recipe?.ingredients?.length || 0;

                  return (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-[#26313C] bg-[#0B0F14] px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DIETARY_DOT[item.dietaryType] ?? '#9AA6B2' }} />
                        <span className="text-sm font-semibold text-[#F5F7FA]">{item.name}</span>
                        <span className="font-mono text-xs text-[#9AA6B2]">{item.code}</span>
                        
                        {/* [V2 FEATURE - Recipe Badge (Commented out for V1)] */}
                        {/*
                        <button
                          type="button"
                          onClick={() => openQuickRecipeModal(item)}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border transition-all ${
                            hasRecipe
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                          title="Click to view or edit inventory recipe consumption"
                        >
                          <span>{hasRecipe ? '🥫' : '⚠️'}</span>
                          <span>{hasRecipe ? `${ingCount} Ingredients` : 'Map Recipe'}</span>
                        </button>
                        */}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[#2AFEB7]">{formatCurrency(item.price)}</span>
                        <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${item.status === 'ACTIVE' ? 'border-[#22C55E]/30 text-[#22C55E]' : 'border-[#9AA6B2]/30 text-[#9AA6B2]'}`}>
                          {item.status}
                        </span>
                        <button type="button" onClick={() => router.push(`/menu-items/${item.id}/edit`)}
                          className="rounded border border-[#26313C] px-2 py-1 text-[10px] text-[#9AA6B2] hover:border-[#2AFEB7] hover:text-[#2AFEB7]">Edit</button>
                        <button type="button" onClick={() => setDeletingItem(item)}
                          className="rounded border border-[#EF4444]/30 px-2 py-1 text-[10px] text-[#EF4444] hover:bg-[#EF4444]/10">✕</button>
                      </div>
                    </div>
                  );
                })}

                {/* Inline Add Item Form with Recipe Mapping */}
                {addItemCatId === cat.id ? (
                  <div className="rounded-xl border border-[#2AFEB7]/30 bg-[#141C24] p-4 space-y-4 shadow-lg animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-[#26313C] pb-2">
                      <span className="text-xs font-bold text-[#2AFEB7] uppercase tracking-wider">Add New Dish to {cat.name}</span>
                      <button type="button" onClick={() => setAddItemCatId(null)} className="text-xs text-[#9AA6B2] hover:text-white">✕ Close</button>
                    </div>

                    {itemError && <p className="text-xs text-[#EF4444] bg-[#EF4444]/10 p-2 rounded-lg">{itemError}</p>}
                    
                    {/* Basic Item Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-[#9AA6B2] uppercase mb-1">Dish Name *</label>
                        <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Crispy Garlic Paneer"
                          className="w-full rounded-lg border border-[#26313C] bg-[#0B0F14] px-3 py-2 text-xs text-[#F5F7FA] focus:border-[#2AFEB7] focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#9AA6B2] uppercase mb-1">Dish Code *</label>
                        <input value={itemCode} onChange={(e) => setItemCode(e.target.value.toUpperCase())} placeholder="GARLIC-PAN"
                          className="w-full rounded-lg border border-[#26313C] bg-[#0B0F14] px-3 py-2 text-xs font-mono text-[#F5F7FA] focus:border-[#2AFEB7] focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#9AA6B2] uppercase mb-1">Price (₹) *</label>
                        <input type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} placeholder="240" min={0} step={0.01}
                          className="w-full rounded-lg border border-[#26313C] bg-[#0B0F14] px-3 py-2 text-xs text-[#F5F7FA] focus:border-[#2AFEB7] focus:outline-none" />
                      </div>
                    </div>

                    {/* [V2 FEATURE - Recipe & Ingredients section (Commented out for V1)] */}
                    {/*
                    <div className="rounded-xl border border-[#26313C] bg-[#111820] p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🥫</span>
                          <span className="text-xs font-bold text-white">Recipe & Raw Ingredients (Auto-Deductions)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowRecipeSection(!showRecipeSection)}
                          className="text-[11px] font-semibold text-[#2AFEB7] hover:underline"
                        >
                          {showRecipeSection ? '▲ Hide Ingredients' : '▼ Map Ingredients for this Dish'}
                        </button>
                      </div>

                      {showRecipeSection && (
                        <div className="space-y-2 pt-2 border-t border-[#26313C]">
                          <p className="text-[11px] text-[#9AA6B2]">
                            Select raw ingredients deducted each time this dish is ordered:
                          </p>

                          {newItemIngredients.map((ingRow, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <select
                                value={ingRow.ingredientId}
                                onChange={(e) => {
                                  const updated = [...newItemIngredients];
                                  updated[idx].ingredientId = e.target.value;
                                  setNewItemIngredients(updated);
                                }}
                                className="flex-1 rounded-lg border border-[#26313C] bg-[#0B0F14] px-2.5 py-1.5 text-xs text-[#F5F7FA] focus:border-[#2AFEB7] focus:outline-none"
                              >
                                <option value="">Select raw ingredient...</option>
                                {availableIngredients.map((i) => (
                                  <option key={i.id} value={i.id}>
                                    {i.name} ({i.unitOfMeasure})
                                  </option>
                                ))}
                              </select>

                              <div className="w-28">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  placeholder="Quantity"
                                  value={ingRow.quantityRequired}
                                  onChange={(e) => {
                                    const updated = [...newItemIngredients];
                                    updated[idx].quantityRequired = parseFloat(e.target.value) || 0;
                                    setNewItemIngredients(updated);
                                  }}
                                  className="w-full rounded-lg border border-[#26313C] bg-[#0B0F14] px-2.5 py-1.5 text-xs text-[#F5F7FA] focus:border-[#2AFEB7] focus:outline-none"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => setNewItemIngredients(newItemIngredients.filter((_, i) => i !== idx))}
                                className="text-[#EF4444] hover:text-red-300 px-2 py-1 text-xs"
                                title="Remove ingredient"
                              >
                                ✕
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => setNewItemIngredients([...newItemIngredients, { ingredientId: '', quantityRequired: 100 }])}
                            className="text-[11px] font-semibold text-[#2AFEB7] hover:underline flex items-center gap-1 pt-1"
                          >
                            <span>➕</span> Add Another Ingredient
                          </button>
                        </div>
                      )}
                    </div>
                    */}

                    <div className="flex justify-end gap-2 pt-2 border-t border-[#26313C]">
                      <button type="button" onClick={() => setAddItemCatId(null)} disabled={itemSaving}
                        className="rounded-lg border border-[#26313C] px-3 py-1.5 text-xs text-[#9AA6B2] hover:border-[#2AFEB7] disabled:opacity-50">Cancel</button>
                      <button type="button" onClick={() => saveItem(cat.id)} disabled={itemSaving}
                        className="rounded-lg bg-[#2AFEB7] px-4 py-1.5 text-xs font-bold text-[#0B0F14] hover:bg-[#22E5A4] disabled:opacity-50 shadow">
                        {itemSaving ? 'Saving...' : 'Add Item'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => openItemForm(cat.id)}
                    className="w-full rounded-lg border border-dashed border-[#26313C] px-3 py-2 text-xs text-[#9AA6B2] transition-colors hover:border-[#2AFEB7]/40 hover:text-[#2AFEB7]">
                    + Add Item to {cat.name}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* [V2 FEATURE - QUICK RECIPE MODAL (Commented out for V1)] */}
      {/*
      {quickRecipeItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111820] border border-[#26313C] rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#26313C]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🥫</span> Recipe: {quickRecipeItem.name}
                </h3>
                <p className="text-xs text-[#9AA6B2]">Configure automatic inventory stock deductions per order.</p>
              </div>
              <button onClick={() => setQuickRecipeItem(null)} className="text-[#9AA6B2] hover:text-white">✕</button>
            </div>

            <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
              {quickRecipeIngredients.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 bg-[#18212B] rounded-xl border border-[#26313C]">
                  <select
                    value={row.ingredientId}
                    onChange={(e) => {
                      const updated = [...quickRecipeIngredients];
                      updated[idx].ingredientId = e.target.value;
                      setQuickRecipeIngredients(updated);
                    }}
                    className="flex-1 rounded-lg border border-[#26313C] bg-[#0B0F14] px-2.5 py-1.5 text-xs text-white focus:border-[#2AFEB7] focus:outline-none"
                  >
                    <option value="">Select raw ingredient...</option>
                    {availableIngredients.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.unitOfMeasure})
                      </option>
                    ))}
                  </select>

                  <div className="w-28">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Qty"
                      value={row.quantityRequired}
                      onChange={(e) => {
                        const updated = [...quickRecipeIngredients];
                        updated[idx].quantityRequired = parseFloat(e.target.value) || 0;
                        setQuickRecipeIngredients(updated);
                      }}
                      className="w-full rounded-lg border border-[#26313C] bg-[#0B0F14] px-2.5 py-1.5 text-xs text-white focus:border-[#2AFEB7] focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setQuickRecipeIngredients(quickRecipeIngredients.filter((_, i) => i !== idx))}
                    className="text-[#EF4444] hover:text-red-300 p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setQuickRecipeIngredients([...quickRecipeIngredients, { ingredientId: '', quantityRequired: 100 }])}
                className="w-full py-2 border border-dashed border-[#26313C] hover:border-[#2AFEB7] text-[#2AFEB7] rounded-xl text-xs font-semibold"
              >
                ➕ Add Another Raw Ingredient
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#26313C]">
              <button
                type="button"
                onClick={() => setQuickRecipeItem(null)}
                className="rounded-lg border border-[#26313C] px-3 py-1.5 text-xs text-[#9AA6B2] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={quickRecipeSaving}
                onClick={saveQuickRecipe}
                className="rounded-lg bg-[#2AFEB7] px-4 py-1.5 text-xs font-bold text-[#0B0F14] hover:bg-[#22E5A4] disabled:opacity-50"
              >
                {quickRecipeSaving ? 'Saving...' : 'Save Recipe'}
              </button>
            </div>
          </div>
        </div>
      )}
      */}

      <ConfirmDialog
        open={Boolean(deletingCat)}
        title="Delete Category?"
        description={`Delete "${deletingCat?.name}"? All items in this category will also be removed.`}
        confirmText={isDeletingCat ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={confirmDeleteCat}
        onCancel={() => setDeletingCat(null)}
      />
      <ConfirmDialog
        open={Boolean(deletingItem)}
        title="Delete Item?"
        description={`Delete "${deletingItem?.name}"? This action cannot be undone.`}
        confirmText={isDeletingItem ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={confirmDeleteItem}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
}
