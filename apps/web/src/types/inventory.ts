export type UnitOfMeasure = 'KG' | 'GRAM' | 'LITER' | 'ML' | 'PIECE' | 'BOX';

export type StockTransactionType =
  | 'RECIPE_DEDUCTION'
  | 'MANUAL_PURCHASE'
  | 'WASTE_SPOILAGE'
  | 'AUDIT_ADJUSTMENT';

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface Ingredient {
  id: string;
  name: string;
  unitOfMeasure: UnitOfMeasure;
  currentStock: number;
  minimumReorderLevel: number;
  costPerUnit: number;
  totalValuation: number;
  status: StockStatus;
  location?: { id: string; name: string; code: string } | null;
  supplier?: { id: string; name: string; phone?: string } | null;
  recipesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMetrics {
  totalItems: number;
  totalValuation: number;
  lowStockCount: number;
  outOfStockCount: number;
  monthlyWastageCost: number;
}

export interface RecipeIngredient {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantityRequired: number;
  unitOfMeasure: UnitOfMeasure;
  costContribution: number;
}

export interface MenuItemRecipe {
  menuItemId: string;
  menuItemName: string;
  categoryName: string;
  price: number;
  hasRecipe: boolean;
  recipe?: {
    id: string;
    ingredients: RecipeIngredient[];
    totalRecipeCost: number;
  } | null;
}

export interface StockMovement {
  id: string;
  transactionType: StockTransactionType;
  quantityDelta: number;
  balanceAfter: number;
  ingredient?: {
    id: string;
    name: string;
    unitOfMeasure: UnitOfMeasure;
    costPerUnit: number;
  };
  order?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
  } | null;
  supplier?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  createdAt: string;
}

export interface InventoryLocation {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}
