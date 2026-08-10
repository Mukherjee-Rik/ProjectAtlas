-- CreateTable
CREATE TABLE "tenant_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_memberships_userId_idx" ON "tenant_memberships"("userId");

-- CreateIndex
CREATE INDEX "tenant_memberships_tenantId_idx" ON "tenant_memberships"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_memberships_userId_tenantId_key" ON "tenant_memberships"("userId", "tenantId");

-- AddForeignKey
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
