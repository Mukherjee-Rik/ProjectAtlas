export type MenuStatus = 'ACTIVE' | 'INACTIVE';
export type MenuCategoryStatus = 'ACTIVE' | 'INACTIVE';
export type MenuItemStatus = 'ACTIVE' | 'INACTIVE';
export type DietaryType = 'VEG' | 'NON_VEG' | 'EGG' | 'VEGAN';
export type FoodType = 'FOOD' | 'BEVERAGE' | 'DESSERT' | 'OTHER';

export interface Menu {
  id: string;
  restaurantId: string;
  name: string;
  code: string;
  status: MenuStatus;
  createdAt: string;
  updatedAt: string;
  _count?: { categories: number };
  categories?: MenuCategory[];
}

export interface MenuCategory {
  id: string;
  menuId: string;
  name: string;
  code: string;
  position: number;
  status: MenuCategoryStatus;
  createdAt: string;
  updatedAt: string;
  _count?: { items: number };
  items?: MenuItem[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  taxRateId?: string | null;
  name: string;
  code: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  dietaryType: DietaryType;
  foodType: FoodType;
  preparationTimeMinutes?: number | null;
  position: number;
  status: MenuItemStatus;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string; code: string; menuId?: string };
  taxRate?: { id?: string; name: string; type: 'PERCENTAGE' | 'FIXED'; value: number } | null;
  variantGroups?: VariantGroup[];
  addonGroups?: AddonGroup[];
}

export interface VariantGroup {
  id: string;
  menuItemId?: string;
  name: string;
  required: boolean;
  position: number;
  variants: Variant[];
}

export interface Variant {
  id: string;
  groupId?: string;
  name: string;
  price: number;
  position: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface AddonGroup {
  id: string;
  menuItemId?: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  position: number;
  addons: Addon[];
}

export interface Addon {
  id: string;
  groupId?: string;
  name: string;
  price: number;
  position: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface TaxRate {
  id: string;
  restaurantId: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export type PublicCustomerMenuItem =
  PublicCustomerMenu['categories'][number]['items'][number];

export interface PublicCustomerMenuItemDetail {
  restaurant: { name: string };
  table: { name: string };
  item: PublicCustomerMenuItem & { category: { name: string } };
}

export interface PublicCustomerMenu {
  restaurant: { name: string };
  branch: { name: string };
  diningArea: { name: string };
  table: { name: string };
  menu: { name: string };
  categories: {
    id: string; name: string; code: string; position: number;
    items: {
      id: string; name: string; code: string; description?: string | null;
      imageUrl?: string | null; price: number; dietaryType: DietaryType;
      foodType: FoodType; preparationTimeMinutes?: number | null; position: number;
      taxRate?: { name: string; type: string; value: number } | null;
      variantGroups: VariantGroup[];
      addonGroups: AddonGroup[];
    }[];
  }[];
}
