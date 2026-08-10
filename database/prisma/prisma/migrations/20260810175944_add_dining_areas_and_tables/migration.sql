-- CreateEnum
CREATE TYPE "DiningAreaStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "dining_areas" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "DiningAreaStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dining_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" TEXT NOT NULL,
    "diningAreaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "TableStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dining_areas_branchId_idx" ON "dining_areas"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "dining_areas_branchId_code_key" ON "dining_areas"("branchId", "code");

-- CreateIndex
CREATE INDEX "tables_diningAreaId_idx" ON "tables"("diningAreaId");

-- CreateIndex
CREATE INDEX "tables_status_idx" ON "tables"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tables_diningAreaId_code_key" ON "tables"("diningAreaId", "code");

-- AddForeignKey
ALTER TABLE "dining_areas" ADD CONSTRAINT "dining_areas_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_diningAreaId_fkey" FOREIGN KEY ("diningAreaId") REFERENCES "dining_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
