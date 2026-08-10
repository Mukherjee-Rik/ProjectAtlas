-- CreateEnum
CREATE TYPE "MenuStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MenuCategoryStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MenuItemStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "menus" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "MenuStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_categories" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "MenuCategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "MenuItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "menus_restaurantId_idx" ON "menus"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "menus_restaurantId_code_key" ON "menus"("restaurantId", "code");

-- CreateIndex
CREATE INDEX "menu_categories_menuId_idx" ON "menu_categories"("menuId");

-- CreateIndex
CREATE INDEX "menu_categories_position_idx" ON "menu_categories"("position");

-- CreateIndex
CREATE UNIQUE INDEX "menu_categories_menuId_code_key" ON "menu_categories"("menuId", "code");

-- CreateIndex
CREATE INDEX "menu_items_categoryId_idx" ON "menu_items"("categoryId");

-- CreateIndex
CREATE INDEX "menu_items_status_idx" ON "menu_items"("status");

-- CreateIndex
CREATE INDEX "menu_items_position_idx" ON "menu_items"("position");

-- CreateIndex
CREATE UNIQUE INDEX "menu_items_categoryId_code_key" ON "menu_items"("categoryId", "code");

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "menu_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
