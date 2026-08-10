-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "customerSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_item_variants" (
    "id" TEXT NOT NULL,
    "cartItemId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "cart_item_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_item_addons" (
    "id" TEXT NOT NULL,
    "cartItemId" TEXT NOT NULL,
    "addonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "cart_item_addons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "carts_customerSessionId_key" ON "carts"("customerSessionId");

-- CreateIndex
CREATE INDEX "carts_customerSessionId_idx" ON "carts"("customerSessionId");

-- CreateIndex
CREATE INDEX "cart_items_cartId_idx" ON "cart_items"("cartId");

-- CreateIndex
CREATE INDEX "cart_items_menuItemId_idx" ON "cart_items"("menuItemId");

-- CreateIndex
CREATE INDEX "cart_item_variants_cartItemId_idx" ON "cart_item_variants"("cartItemId");

-- CreateIndex
CREATE INDEX "cart_item_addons_cartItemId_idx" ON "cart_item_addons"("cartItemId");

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_customerSessionId_fkey" FOREIGN KEY ("customerSessionId") REFERENCES "customer_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_item_variants" ADD CONSTRAINT "cart_item_variants_cartItemId_fkey" FOREIGN KEY ("cartItemId") REFERENCES "cart_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_item_addons" ADD CONSTRAINT "cart_item_addons_cartItemId_fkey" FOREIGN KEY ("cartItemId") REFERENCES "cart_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
