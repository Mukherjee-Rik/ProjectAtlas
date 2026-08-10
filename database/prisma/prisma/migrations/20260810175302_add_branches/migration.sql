-- CreateEnum
CREATE TYPE "BranchStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "phone" TEXT,
    "status" "BranchStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "branches_restaurantId_idx" ON "branches"("restaurantId");

-- CreateIndex
CREATE INDEX "branches_status_idx" ON "branches"("status");

-- CreateIndex
CREATE UNIQUE INDEX "branches_restaurantId_code_key" ON "branches"("restaurantId", "code");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
