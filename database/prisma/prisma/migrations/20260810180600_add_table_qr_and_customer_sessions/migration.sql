-- CreateEnum
CREATE TYPE "CustomerSessionStatus" AS ENUM ('ACTIVE', 'ENDED', 'EXPIRED');

-- AlterTable
ALTER TABLE "tables" ADD COLUMN "publicToken" TEXT NOT NULL DEFAULT gen_random_uuid();

-- CreateTable
CREATE TABLE "customer_sessions" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "status" "CustomerSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "customer_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tables_publicToken_key" ON "tables"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "customer_sessions_sessionToken_key" ON "customer_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "customer_sessions_tableId_idx" ON "customer_sessions"("tableId");

-- CreateIndex
CREATE INDEX "customer_sessions_status_idx" ON "customer_sessions"("status");

-- AddForeignKey
ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
