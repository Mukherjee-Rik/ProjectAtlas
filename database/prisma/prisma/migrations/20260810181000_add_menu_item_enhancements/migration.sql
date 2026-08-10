-- CreateEnum
CREATE TYPE "DietaryType" AS ENUM ('VEG', 'NON_VEG', 'EGG', 'VEGAN');

-- CreateEnum
CREATE TYPE "FoodType" AS ENUM ('FOOD', 'BEVERAGE', 'DESSERT', 'OTHER');

-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "TaxRateStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MenuItemVariantStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MenuItemAddonStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN "dietaryType" "DietaryType" NOT NULL DEFAULT 'VEG',
ADD COLUMN "foodType" "FoodType" NOT NULL DEFAULT 'FOOD',
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "preparationTimeMinutes" INTEGER,
ADD COLUMN "taxRateId" TEXT;

-- CreateTable
CREATE TABLE "tax_rates" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TaxType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "status" "TaxRateStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_variant_groups" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "menu_item_variant_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_variants" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "MenuItemVariantStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "menu_item_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_addon_groups" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "minSelect" INTEGER NOT NULL DEFAULT 0,
    "maxSelect" INTEGER NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "menu_item_addon_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_addons" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "MenuItemAddonStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "menu_item_addons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tax_rates_restaurantId_idx" ON "tax_rates"("restaurantId");

-- CreateIndex
CREATE INDEX "menu_item_variant_groups_menuItemId_idx" ON "menu_item_variant_groups"("menuItemId");

-- CreateIndex
CREATE INDEX "menu_item_variants_groupId_idx" ON "menu_item_variants"("groupId");

-- CreateIndex
CREATE INDEX "menu_item_addon_groups_menuItemId_idx" ON "menu_item_addon_groups"("menuItemId");

-- CreateIndex
CREATE INDEX "menu_item_addons_groupId_idx" ON "menu_item_addons"("groupId");

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES "tax_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_variant_groups" ADD CONSTRAINT "menu_item_variant_groups_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_variants" ADD CONSTRAINT "menu_item_variants_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "menu_item_variant_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_addon_groups" ADD CONSTRAINT "menu_item_addon_groups_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_addons" ADD CONSTRAINT "menu_item_addons_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "menu_item_addon_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
