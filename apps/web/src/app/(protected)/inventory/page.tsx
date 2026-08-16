'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useRestaurant } from '@/hooks/use-restaurant';
import { apiClient } from '@/services/api-client';
import { formatCurrency } from '@/lib/currency';
import {
  Ingredient,
  InventoryMetrics,
  MenuItemRecipe,
  StockMovement,
  Supplier,
  InventoryLocation,
  UnitOfMeasure,
} from '@/types/inventory';

export default function InventoryPage() {
  const { currentRestaurant, restaurants, setCurrentRestaurant } = useRestaurant();

  // Data states
  const [metrics, setMetrics] = useState<InventoryMetrics>({
    totalItems: 0,
    totalValuation: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    monthlyWastageCost: 0,
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<MenuItemRecipe[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);

  // Navigation & Filter states
  const [activeTab, setActiveTab] = useState<'ingredients' | 'recipes' | 'movements' | 'suppliers'>('ingredients');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [movementFilter, setMovementFilter] = useState<string>('ALL');

  // Modals state
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showWastageModal, setShowWastageModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItemRecipe | null>(null);

  // Form states
  const [ingredientForm, setIngredientForm] = useState({
    name: '',
    unitOfMeasure: 'KG' as UnitOfMeasure,
    minimumReorderLevel: 2,
    costPerUnit: 100,
    initialStock: 0,
    locationId: '',
    supplierId: '',
  });

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactName: '',
    phone: '',
    email: '',
  });

  const [locationForm, setLocationForm] = useState({
    name: '',
    code: '',
  });

  const [stockInForm, setStockInForm] = useState({
    quantity: 1,
    unitOfMeasure: 'KG' as UnitOfMeasure,
    costPerUnit: 0,
    supplierId: '',
    notes: '',
  });

  const [wastageForm, setWastageForm] = useState({
    quantity: 1,
    unitOfMeasure: 'KG' as UnitOfMeasure,
    reason: 'Spoiled in storage',
    notes: '',
  });

  const [adjustmentForm, setAdjustmentForm] = useState({
    physicalCount: 0,
    reason: 'Routine physical count reconciliation',
  });

  const [recipeFormIngredients, setRecipeFormIngredients] = useState<
    { ingredientId: string; quantityRequired: number }[]
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Load Inventory Data
  const loadData = useCallback(async () => {
    if (!currentRestaurant) {
      if (restaurants && restaurants.length > 0) {
        setCurrentRestaurant(restaurants[0]);
      }
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    try {
      const [overviewRes, recipesRes, movementsRes, suppliersRes, locationsRes] = await Promise.allSettled([
        apiClient.get<{
          metrics: InventoryMetrics;
          ingredients: Ingredient[];
        }>('/inventory/overview'),
        apiClient.get<MenuItemRecipe[]>('/inventory/recipes'),
        apiClient.get<StockMovement[]>('/inventory/movements?limit=50'),
        apiClient.get<Supplier[]>('/inventory/suppliers'),
        apiClient.get<InventoryLocation[]>('/inventory/locations'),
      ]);

      if (overviewRes.status === 'fulfilled' && overviewRes.value) {
        const ovData = (overviewRes.value as any)?.data ?? overviewRes.value;
        if (ovData?.metrics) {
          setMetrics(ovData.metrics);
        }
        if (ovData?.ingredients && Array.isArray(ovData.ingredients)) {
          setIngredients(ovData.ingredients);
        }
      }
      if (recipesRes.status === 'fulfilled' && recipesRes.value) {
        const rData = (recipesRes.value as any)?.data ?? recipesRes.value;
        if (Array.isArray(rData)) {
          setRecipes(rData);
        }
      }
      if (movementsRes.status === 'fulfilled' && movementsRes.value) {
        const mData = (movementsRes.value as any)?.data ?? movementsRes.value;
        if (Array.isArray(mData)) {
          setMovements(mData);
        }
      }
      if (suppliersRes.status === 'fulfilled' && suppliersRes.value) {
        const sData = (suppliersRes.value as any)?.data ?? suppliersRes.value;
        if (Array.isArray(sData)) {
          setSuppliers(sData);
        }
      }
      if (locationsRes.status === 'fulfilled' && locationsRes.value) {
        const lData = (locationsRes.value as any)?.data ?? locationsRes.value;
        if (Array.isArray(lData)) {
          setLocations(lData);
        }
      }
    } catch (err: any) {
      showFeedback('Failed to load inventory data: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentRestaurant, restaurants, setCurrentRestaurant]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientForm.name.trim()) return;
    setIsSubmitting(true);

    try {
      await apiClient.post('/inventory/ingredients', {
        name: ingredientForm.name.trim(),
        unitOfMeasure: ingredientForm.unitOfMeasure,
        minimumReorderLevel: Number(ingredientForm.minimumReorderLevel),
        costPerUnit: Number(ingredientForm.costPerUnit),
        initialStock: Number(ingredientForm.initialStock || 0),
        locationId: ingredientForm.locationId || undefined,
        supplierId: ingredientForm.supplierId || undefined,
      });

      showFeedback(`Ingredient "${ingredientForm.name}" created successfully!`);
      setShowAddIngredientModal(false);
      setIngredientForm({
        name: '',
        unitOfMeasure: 'KG',
        minimumReorderLevel: 2,
        costPerUnit: 100,
        initialStock: 0,
        locationId: '',
        supplierId: '',
      });
      loadData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to create ingredient', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;
    setIsSubmitting(true);

    try {
      await apiClient.post('/inventory/suppliers', {
        name: supplierForm.name.trim(),
        contactName: supplierForm.contactName.trim() || undefined,
        phone: supplierForm.phone.trim() || undefined,
        email: supplierForm.email.trim() || undefined,
      });

      showFeedback(`Supplier "${supplierForm.name}" registered successfully!`);
      setShowAddSupplierModal(false);
      setSupplierForm({ name: '', contactName: '', phone: '', email: '' });
      loadData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to register supplier', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationForm.name.trim() || !locationForm.code.trim()) return;
    setIsSubmitting(true);

    try {
      await apiClient.post('/inventory/locations', {
        name: locationForm.name.trim(),
        code: locationForm.code.trim().toUpperCase(),
      });

      showFeedback(`Storage zone "${locationForm.name}" created successfully!`);
      setShowAddLocationModal(false);
      setLocationForm({ name: '', code: '' });
      loadData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to create storage zone', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient) return;
    setIsSubmitting(true);

    try {
      await apiClient.post('/inventory/movements/purchase', {
        ingredientId: selectedIngredient.id,
        quantity: Number(stockInForm.quantity),
        unitOfMeasure: stockInForm.unitOfMeasure,
        costPerUnit: stockInForm.costPerUnit ? Number(stockInForm.costPerUnit) : undefined,
        supplierId: stockInForm.supplierId || undefined,
        notes: stockInForm.notes || undefined,
      });

      showFeedback(`Added ${stockInForm.quantity} ${stockInForm.unitOfMeasure} to ${selectedIngredient.name}!`);
      setShowStockInModal(false);
      loadData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to record purchase', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordWastage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient) return;
    setIsSubmitting(true);

    try {
      await apiClient.post('/inventory/movements/wastage', {
        ingredientId: selectedIngredient.id,
        quantity: Number(wastageForm.quantity),
        unitOfMeasure: wastageForm.unitOfMeasure,
        reason: wastageForm.reason,
        notes: wastageForm.notes || undefined,
      });

      showFeedback(`Recorded wastage for ${selectedIngredient.name}`);
      setShowWastageModal(false);
      loadData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to record wastage', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient) return;
    setIsSubmitting(true);

    try {
      await apiClient.post('/inventory/movements/adjustment', {
        ingredientId: selectedIngredient.id,
        physicalCount: Number(adjustmentForm.physicalCount),
        reason: adjustmentForm.reason,
      });

      showFeedback(`Reconciled stock for ${selectedIngredient.name} to ${adjustmentForm.physicalCount} ${selectedIngredient.unitOfMeasure}`);
      setShowAdjustmentModal(false);
      loadData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to record adjustment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuItem) return;
    setIsSubmitting(true);

    try {
      await apiClient.post('/inventory/recipes', {
        menuItemId: selectedMenuItem.menuItemId,
        ingredients: recipeFormIngredients.filter((ri) => ri.ingredientId && ri.quantityRequired > 0),
      });

      showFeedback(`Recipe for "${selectedMenuItem.menuItemName}" saved successfully!`);
      setShowRecipeModal(false);
      loadData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to save recipe', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRecipeBuilder = (item: MenuItemRecipe) => {
    setSelectedMenuItem(item);
    if (item.recipe && item.recipe.ingredients && item.recipe.ingredients.length > 0) {
      setRecipeFormIngredients(
        item.recipe.ingredients.map((ri) => ({
          ingredientId: ri.ingredientId,
          quantityRequired: ri.quantityRequired,
        })),
      );
    } else {
      setRecipeFormIngredients([{ ingredientId: '', quantityRequired: 100 }]);
    }
    setShowRecipeModal(true);
  };

  // Filtered ingredients
  const filteredIngredients = useMemo(() => {
    return (ingredients || []).filter((ing) => {
      const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (statusFilter === 'LOW_STOCK') return ing.status === 'LOW_STOCK';
      if (statusFilter === 'OUT_OF_STOCK') return ing.status === 'OUT_OF_STOCK';
      return true;
    });
  }, [ingredients, searchTerm, statusFilter]);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    if (movementFilter === 'ALL') return movements || [];
    return (movements || []).filter((m) => m.transactionType === movementFilter);
  }, [movements, movementFilter]);

  if (!currentRestaurant && !isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <div className="text-4xl mb-3">🥫</div>
        <h2 className="text-xl font-bold text-white mb-2">No Restaurant Selected</h2>
        <p className="text-sm text-gray-400 max-w-md mb-6">
          Please select an active restaurant from your organization dashboard to view and manage inventory.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] p-4 sm:p-6 lg:p-8 font-sans">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-3 transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur-md'
          }`}
        >
          <span>{feedbackMsg.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>🥫</span> Automated Inventory & Recipes
            </h1>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20 hidden sm:inline-block">
              Auto-Deductions Active
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Real-time stock depletion linked to customer orders, recipes, wastage, and purchasing ledgers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddIngredientModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            <span>➕</span> Add Ingredient
          </button>
          <button
            onClick={loadData}
            className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all border border-gray-700"
            title="Refresh Data"
          >
            🔄
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Stock Value</span>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-lg">💰</span>
          </div>
          <p className="text-2xl font-black text-white mt-2">{formatCurrency(metrics.totalValuation || 0)}</p>
          <span className="text-xs text-gray-500 mt-1 block">Live inventory asset valuation</span>
        </div>

        <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tracked Ingredients</span>
            <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg text-lg">📦</span>
          </div>
          <p className="text-2xl font-black text-white mt-2">{metrics.totalItems || 0} Items</p>
          <span className="text-xs text-gray-500 mt-1 block">Across all food & beverage items</span>
        </div>

        <div
          className={`bg-[#161b22] border rounded-2xl p-5 shadow-sm cursor-pointer transition-all ${
            metrics.lowStockCount > 0 ? 'border-amber-500/40 bg-amber-500/5' : 'border-gray-800'
          }`}
          onClick={() => {
            setActiveTab('ingredients');
            setStatusFilter(metrics.lowStockCount > 0 ? 'LOW_STOCK' : 'ALL');
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Low Stock Warnings</span>
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg text-lg">⚠️</span>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{metrics.lowStockCount || 0} Items</p>
          <span className="text-xs text-amber-500/80 mt-1 block">Below minimum threshold</span>
        </div>

        <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Monthly Wastage</span>
            <span className="p-2 bg-rose-500/10 text-rose-400 rounded-lg text-lg">🗑️</span>
          </div>
          <p className="text-2xl font-black text-rose-400 mt-2">{formatCurrency(metrics.monthlyWastageCost || 0)}</p>
          <span className="text-xs text-gray-500 mt-1 block">Recorded spoilage (last 30 days)</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 mb-6 overflow-x-auto no-scrollbar touch-pan-x flex-nowrap shrink-0">
        <button
          onClick={() => setActiveTab('ingredients')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            activeTab === 'ingredients'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>📦</span> Ingredients & Stock Ledger ({ingredients.length})
        </button>

        <button
          onClick={() => setActiveTab('recipes')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            activeTab === 'recipes'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>🍔</span> Recipe Mapping ({recipes.length})
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            activeTab === 'movements'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>📜</span> Stock Movements Audit Trail
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            activeTab === 'suppliers'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>🏢</span> Suppliers & Storage Zones ({suppliers.length + locations.length})
        </button>
      </div>

      {/* TAB 1: INGREDIENTS TABLE */}
      {activeTab === 'ingredients' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#161b22] p-4 rounded-xl border border-gray-800">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0d1117] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              />
              <span className="absolute left-3 top-2.5 text-gray-500">🔍</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar touch-pan-x flex-nowrap">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  statusFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                All ({ingredients.length})
              </button>
              <button
                onClick={() => setStatusFilter('LOW_STOCK')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  statusFilter === 'LOW_STOCK'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-800 text-amber-400 hover:bg-gray-700'
                }`}
              >
                ⚠️ Low Stock ({metrics.lowStockCount || 0})
              </button>
              <button
                onClick={() => setStatusFilter('OUT_OF_STOCK')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  statusFilter === 'OUT_OF_STOCK'
                    ? 'bg-rose-600 text-white'
                    : 'bg-gray-800 text-rose-400 hover:bg-gray-700'
                }`}
              >
                ❌ Out of Stock ({metrics.outOfStockCount || 0})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl overflow-hidden shadow-sm table-responsive">
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-900/40">
                  <th className="py-4 px-5">Ingredient</th>
                  <th className="py-4 px-5">Current Stock</th>
                  <th className="py-4 px-5">Min Level</th>
                  <th className="py-4 px-5">Cost / Unit</th>
                  <th className="py-4 px-5">Valuation</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-gray-800/60 text-sm">
                  {filteredIngredients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        No ingredients found matching your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredIngredients.map((ing) => {
                      const stockPercentage = Math.min(
                        100,
                        Math.round((ing.currentStock / (ing.minimumReorderLevel * 2 || 1)) * 100),
                      );

                      return (
                        <tr key={ing.id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="py-4 px-5">
                            <div className="font-semibold text-white">{ing.name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                              <span>Unit: {ing.unitOfMeasure}</span>
                              {ing.location && <span>• 📍 {ing.location.name}</span>}
                              {ing.supplier && <span>• 🏢 {ing.supplier.name}</span>}
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <div className="font-bold text-white">
                              {ing.currentStock} {ing.unitOfMeasure}
                            </div>
                            <div className="w-24 bg-gray-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  ing.status === 'OUT_OF_STOCK'
                                    ? 'bg-rose-500 w-full'
                                    : ing.status === 'LOW_STOCK'
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.max(5, stockPercentage)}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-4 px-5 text-gray-400">
                            {ing.minimumReorderLevel} {ing.unitOfMeasure}
                          </td>
                          <td className="py-4 px-5 font-mono text-gray-300">
                            {formatCurrency(ing.costPerUnit)} / {ing.unitOfMeasure}
                          </td>
                          <td className="py-4 px-5 font-mono font-semibold text-emerald-400">
                            {formatCurrency(ing.totalValuation)}
                          </td>
                          <td className="py-4 px-5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                ing.status === 'OUT_OF_STOCK'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : ing.status === 'LOW_STOCK'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {ing.status === 'OUT_OF_STOCK'
                                ? '❌ Out of Stock'
                                : ing.status === 'LOW_STOCK'
                                ? '⚠️ Low Stock'
                                : '✅ In Stock'}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedIngredient(ing);
                                  setStockInForm({
                                    quantity: 10,
                                    unitOfMeasure: ing.unitOfMeasure,
                                    costPerUnit: ing.costPerUnit,
                                    supplierId: ing.supplier?.id || '',
                                    notes: '',
                                  });
                                  setShowStockInModal(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded-lg text-xs font-medium border border-emerald-500/30 transition-all"
                                title="Add Stock (Purchase)"
                              >
                                📦 Stock In
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedIngredient(ing);
                                  setWastageForm({
                                    quantity: 1,
                                    unitOfMeasure: ing.unitOfMeasure,
                                    reason: 'Spoiled in storage',
                                    notes: '',
                                  });
                                  setShowWastageModal(true);
                                }}
                                className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg text-xs font-medium border border-rose-500/30 transition-all"
                                title="Log Wastage"
                              >
                                🗑️ Wastage
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedIngredient(ing);
                                  setAdjustmentForm({
                                    physicalCount: ing.currentStock,
                                    reason: 'Physical count audit',
                                  });
                                  setShowAdjustmentModal(true);
                                }}
                                className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg text-xs font-medium border border-blue-500/30 transition-all"
                                title="Audit Stock Adjustment"
                              >
                                ⚖️ Reconcile
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* TAB 2: RECIPES */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          <div className="bg-[#161b22] p-4 rounded-xl border border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Menu Item Recipe & Consumption Engine</h3>
              <p className="text-gray-400 text-xs mt-0.5">
                Every confirmed order automatically calculates ingredient deductions based on mapped recipes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recipes.map((item) => (
              <div
                key={item.menuItemId}
                className="bg-[#161b22] border border-gray-800 hover:border-gray-700 rounded-2xl p-5 flex flex-col justify-between shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                        {item.categoryName}
                      </span>
                      <h4 className="text-lg font-bold text-white mt-1">{item.menuItemName}</h4>
                      <p className="text-sm text-gray-400 font-mono mt-0.5">Menu Price: {formatCurrency(item.price)}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.hasRecipe
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {item.hasRecipe ? '✅ Recipe Mapped' : '⚠️ No Recipe'}
                    </span>
                  </div>

                  {item.recipe && item.recipe.ingredients && item.recipe.ingredients.length > 0 ? (
                    <div className="mt-4 pt-4 border-t border-gray-800/80">
                      <div className="text-xs font-bold text-gray-400 uppercase mb-2">Ingredients Required:</div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {item.recipe.ingredients.map((ri) => (
                          <div key={ri.id} className="flex items-center justify-between text-xs bg-gray-900/60 px-2.5 py-1.5 rounded-lg">
                            <span className="text-gray-300 font-medium">{ri.ingredientName}</span>
                            <span className="font-mono text-indigo-300">
                              {ri.quantityRequired} {ri.unitOfMeasure === 'KG' ? 'g' : ri.unitOfMeasure}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 py-6 text-center text-xs text-gray-500 bg-gray-900/40 rounded-xl">
                      No ingredients configured yet.
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {item.recipe?.ingredients?.length || 0} ingredients linked
                  </span>
                  <button
                    onClick={() => openRecipeBuilder(item)}
                    className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-500/30 transition-all flex items-center gap-1.5"
                  >
                    <span>✏️</span> {item.hasRecipe ? 'Edit Recipe' : 'Map Recipe'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MOVEMENTS AUDIT TRAIL */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#161b22] p-4 rounded-xl border border-gray-800">
            <div>
              <h3 className="font-bold text-white text-base">Real-Time Stock Movement Ledger</h3>
              <p className="text-gray-400 text-xs mt-0.5">
                Every sale, purchase, spoilage, and adjustment is permanently recorded with complete traceability.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={movementFilter}
                onChange={(e) => setMovementFilter(e.target.value)}
                className="bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Movement Types</option>
                <option value="RECIPE_DEDUCTION">Recipe Deductions (Sales)</option>
                <option value="MANUAL_PURCHASE">Stock In / Purchases</option>
                <option value="WASTE_SPOILAGE">Wastage / Spoilage</option>
                <option value="AUDIT_ADJUSTMENT">Audit Adjustments</option>
              </select>
            </div>
          </div>

          <div className="bg-[#161b22] border border-gray-800 rounded-2xl overflow-hidden shadow-sm table-responsive">
            <table className="w-full min-w-[700px] text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-900/40">
                    <th className="py-4 px-5">Timestamp</th>
                    <th className="py-4 px-5">Ingredient</th>
                    <th className="py-4 px-5">Type</th>
                    <th className="py-4 px-5">Quantity Change</th>
                    <th className="py-4 px-5">Balance After</th>
                    <th className="py-4 px-5">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        No movement records found.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => {
                      const isPositive = m.quantityDelta > 0;
                      return (
                        <tr key={m.id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="py-4 px-5 text-gray-400 text-xs">
                            {new Date(m.createdAt).toLocaleString()}
                          </td>
                          <td className="py-4 px-5 font-semibold text-white">
                            {m.ingredient?.name || 'Unknown Item'}
                          </td>
                          <td className="py-4 px-5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                m.transactionType === 'RECIPE_DEDUCTION'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : m.transactionType === 'MANUAL_PURCHASE'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : m.transactionType === 'WASTE_SPOILAGE'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              }`}
                            >
                              {m.transactionType === 'RECIPE_DEDUCTION'
                                ? '🍽️ Order Deduction'
                                : m.transactionType === 'MANUAL_PURCHASE'
                                ? '📦 Stock In'
                                : m.transactionType === 'WASTE_SPOILAGE'
                                ? '🗑️ Spoilage'
                                : '⚖️ Adjustment'}
                            </span>
                          </td>
                          <td className="py-4 px-5 font-mono font-bold">
                            <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                              {isPositive ? '+' : ''}
                              {m.quantityDelta} {m.ingredient?.unitOfMeasure}
                            </span>
                          </td>
                          <td className="py-4 px-5 font-mono text-gray-300">
                            {m.balanceAfter} {m.ingredient?.unitOfMeasure}
                          </td>
                          <td className="py-4 px-5 text-xs text-gray-400">
                            {m.order ? (
                              <span className="font-semibold text-indigo-400">Order #{m.order.orderNumber}</span>
                            ) : m.supplier ? (
                              <span>Supplier: {m.supplier.name}</span>
                            ) : (
                              <span>Manual Entry</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* TAB 4: SUPPLIERS & LOCATIONS */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Suppliers list */}
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-0.5">🏢 Approved Suppliers ({suppliers.length})</h3>
                  <p className="text-gray-400 text-xs">Vendors delivering raw ingredients and packaging.</p>
                </div>
                <button
                  onClick={() => setShowAddSupplierModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  <span>➕</span> Add Supplier
                </button>
              </div>

              <div className="space-y-3">
                {suppliers.length === 0 ? (
                  <div className="text-sm text-gray-500 py-8 text-center border border-dashed border-gray-800 rounded-xl">
                    No suppliers registered yet. Click "Add Supplier" to add vendor contact details.
                  </div>
                ) : (
                  suppliers.map((s) => (
                    <div key={s.id} className="p-3.5 bg-gray-900/60 rounded-xl border border-gray-800 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">{s.name}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                          {s.contactName && <span>👤 {s.contactName}</span>}
                          {s.phone && <span>📞 {s.phone}</span>}
                          {s.email && <span>✉️ {s.email}</span>}
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 font-medium">
                        Active Vendor
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Storage Locations */}
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-0.5">📍 Storage Zones ({locations.length})</h3>
                  <p className="text-gray-400 text-xs">Kitchen stations, freezers, and pantry zones.</p>
                </div>
                <button
                  onClick={() => setShowAddLocationModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  <span>➕</span> Add Storage Zone
                </button>
              </div>

              <div className="space-y-3">
                {locations.length === 0 ? (
                  <div className="text-sm text-gray-500 py-8 text-center border border-dashed border-gray-800 rounded-xl">
                    No storage zones configured yet. Click "Add Storage Zone" to define pantries and cold rooms.
                  </div>
                ) : (
                  locations.map((loc) => (
                    <div key={loc.id} className="p-3.5 bg-gray-900/60 rounded-xl border border-gray-800 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">{loc.name}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">Code: {loc.code}</div>
                      </div>
                      <span className="text-xs px-2.5 py-1 bg-indigo-500/15 text-indigo-300 rounded-lg border border-indigo-500/30 font-medium">
                        Storage Location
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS
      ========================================================================== */}

      {/* MODAL: ADD SUPPLIER */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🏢</span> Add Approved Supplier
              </h3>
              <button onClick={() => setShowAddSupplierModal(false)} className="text-gray-400 hover:text-white text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Supplier / Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Farm Produce Ltd, Metro Dairy"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Contact Person Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={supplierForm.contactName}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contactName: e.target.value })}
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="vendor@supply.com"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STORAGE ZONE */}
      {showAddLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📍</span> Add Storage Zone
              </h3>
              <button onClick={() => setShowAddLocationModal(false)} className="text-gray-400 hover:text-white text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLocation} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Storage Zone Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Walk-In Cold Freezer #1, Dry Pantry Zone"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Zone Code / Identifier *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FREEZER-01, DRY-PANTRY, BAR-STORE"
                  value={locationForm.code}
                  onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value.toUpperCase() })}
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddLocationModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Save Storage Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD INGREDIENT */}
      {showAddIngredientModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-gray-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🥫</span> Add Raw Ingredient
              </h3>
              <button
                onClick={() => setShowAddIngredientModal(false)}
                className="text-gray-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIngredient} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Ingredient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Tomatoes, Chicken Breast, Olive Oil"
                  value={ingredientForm.name}
                  onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Unit of Measure *</label>
                  <select
                    value={ingredientForm.unitOfMeasure}
                    onChange={(e) =>
                      setIngredientForm({ ...ingredientForm, unitOfMeasure: e.target.value as UnitOfMeasure })
                    }
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="KG">KG (Kilograms)</option>
                    <option value="GRAM">GRAM (Grams)</option>
                    <option value="LITER">LITER (Liters)</option>
                    <option value="ML">ML (Milliliters)</option>
                    <option value="PIECE">PIECE (Count)</option>
                    <option value="BOX">BOX (Packaging)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Cost per Unit (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={ingredientForm.costPerUnit}
                    onChange={(e) =>
                      setIngredientForm({ ...ingredientForm, costPerUnit: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Initial Stock Count</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={ingredientForm.initialStock}
                    onChange={(e) =>
                      setIngredientForm({ ...ingredientForm, initialStock: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Min Alert Threshold</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    required
                    value={ingredientForm.minimumReorderLevel}
                    onChange={(e) =>
                      setIngredientForm({ ...ingredientForm, minimumReorderLevel: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Storage Location</label>
                  <select
                    value={ingredientForm.locationId}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, locationId: e.target.value })}
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select location...</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Primary Supplier</label>
                  <select
                    value={ingredientForm.supplierId}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, supplierId: e.target.value })}
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddIngredientModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Save Ingredient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STOCK IN (PURCHASE) */}
      {showStockInModal && selectedIngredient && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📦</span> Stock In: {selectedIngredient.name}
              </h3>
              <button onClick={() => setShowStockInModal(false)} className="text-gray-400 hover:text-white text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleStockIn} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Quantity Received</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    required
                    value={stockInForm.quantity}
                    onChange={(e) => setStockInForm({ ...stockInForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="px-4 py-2.5 bg-gray-800 text-gray-300 text-sm font-bold rounded-xl border border-gray-700">
                    {selectedIngredient.unitOfMeasure}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Unit Purchase Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={stockInForm.costPerUnit}
                  onChange={(e) => setStockInForm({ ...stockInForm, costPerUnit: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Notes / Invoice #</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly vendor market purchase #INV-482"
                  value={stockInForm.notes}
                  onChange={(e) => setStockInForm({ ...stockInForm, notes: e.target.value })}
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowStockInModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: WASTAGE */}
      {showWastageModal && selectedIngredient && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🗑️</span> Record Spoilage: {selectedIngredient.name}
              </h3>
              <button onClick={() => setShowWastageModal(false)} className="text-gray-400 hover:text-white text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordWastage} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Wasted Quantity</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    required
                    value={wastageForm.quantity}
                    onChange={(e) => setWastageForm({ ...wastageForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                  <span className="px-4 py-2.5 bg-gray-800 text-gray-300 text-sm font-bold rounded-xl border border-gray-700">
                    {selectedIngredient.unitOfMeasure}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Reason for Wastage *</label>
                <select
                  value={wastageForm.reason}
                  onChange={(e) => setWastageForm({ ...wastageForm, reason: e.target.value })}
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Spoiled in storage">Spoiled in storage / Expired</option>
                  <option value="Kitchen prep burn / drop">Kitchen prep error / Dropped</option>
                  <option value="Customer return / bad batch">Customer return / Bad batch</option>
                  <option value="Handling damage">Handling damage / Contamination</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowWastageModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Record Spoilage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADJUSTMENT */}
      {showAdjustmentModal && selectedIngredient && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>⚖️</span> Physical Count Audit: {selectedIngredient.name}
              </h3>
              <button onClick={() => setShowAdjustmentModal(false)} className="text-gray-400 hover:text-white text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordAdjustment} className="space-y-4 mt-5">
              <div className="p-3 bg-gray-900/60 rounded-xl text-xs text-gray-400 flex items-center justify-between">
                <span>Current Recorded Stock:</span>
                <span className="font-bold text-white">
                  {selectedIngredient.currentStock} {selectedIngredient.unitOfMeasure}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Actual Physical Count</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    required
                    value={adjustmentForm.physicalCount}
                    onChange={(e) =>
                      setAdjustmentForm({ ...adjustmentForm, physicalCount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="px-4 py-2.5 bg-gray-800 text-gray-300 text-sm font-bold rounded-xl border border-gray-700">
                    {selectedIngredient.unitOfMeasure}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Reconcile Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: RECIPE BUILDER */}
      {showRecipeModal && selectedMenuItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-gray-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🍔</span> Recipe Mapping: {selectedMenuItem.menuItemName}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Define ingredients consumed per unit served (e.g. 150g chicken, 50g tomato).
                </p>
              </div>
              <button onClick={() => setShowRecipeModal(false)} className="text-gray-400 hover:text-white text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="flex flex-col flex-1 overflow-hidden mt-4">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
                {recipeFormIngredients.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-gray-900/60 rounded-xl border border-gray-800"
                  >
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Ingredient</label>
                      <select
                        value={item.ingredientId}
                        onChange={(e) => {
                          const updated = [...recipeFormIngredients];
                          updated[idx].ingredientId = e.target.value;
                          setRecipeFormIngredients(updated);
                        }}
                        className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        required
                      >
                        <option value="">Select ingredient...</option>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unitOfMeasure})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-36">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Quantity</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        placeholder="e.g. 150"
                        value={item.quantityRequired}
                        onChange={(e) => {
                          const updated = [...recipeFormIngredients];
                          updated[idx].quantityRequired = parseFloat(e.target.value) || 0;
                          setRecipeFormIngredients(updated);
                        }}
                        className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setRecipeFormIngredients(recipeFormIngredients.filter((_, i) => i !== idx));
                      }}
                      className="mt-5 text-gray-500 hover:text-rose-400 text-sm p-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
                      title="Remove row"
                    >
                      🗑️
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setRecipeFormIngredients([...recipeFormIngredients, { ingredientId: '', quantityRequired: 100 }])
                  }
                  className="w-full py-2.5 border border-dashed border-gray-700 hover:border-indigo-500/60 rounded-xl text-xs font-semibold text-gray-400 hover:text-indigo-400 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>➕</span> Add Another Ingredient
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 mt-4">
                <button
                  type="button"
                  onClick={() => setShowRecipeModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Recipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
