-- CreateEnum
CREATE TYPE "VerticalStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "VerticalDefinitionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "VerticalDropletStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "DropletType" AS ENUM ('READONLY_TABLE');

-- CreateEnum
CREATE TYPE "TenantShellStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'INACTIVE');

-- DropForeignKey
ALTER TABLE "TenantDroplet" DROP CONSTRAINT "TenantDroplet_templateId_fkey";

-- DropForeignKey
ALTER TABLE "TenantDroplet" DROP CONSTRAINT "TenantDroplet_tenantId_fkey";

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "managerId" TEXT;

-- DropTable
DROP TABLE "DropletTemplate";

-- DropTable
DROP TABLE "TenantDroplet";

-- DropEnum
DROP TYPE "DropletTemplateStatus";

-- DropEnum
DROP TYPE "DropletTemplateType";

-- DropEnum
DROP TYPE "TenantDropletStatus";

-- CreateTable
CREATE TABLE "Vertical" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "VerticalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vertical_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerticalDefinition" (
    "id" TEXT NOT NULL,
    "verticalId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "commonModelConfigJson" JSONB NOT NULL,
    "verticalModelConfigJson" JSONB NOT NULL,
    "llmConfigJson" JSONB NOT NULL,
    "commandPackJson" JSONB NOT NULL,
    "skillPackJson" JSONB NOT NULL,
    "orgChartTemplateJson" JSONB NOT NULL,
    "status" "VerticalDefinitionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerticalDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerticalDroplet" (
    "id" TEXT NOT NULL,
    "verticalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "dropletType" "DropletType" NOT NULL,
    "command" TEXT NOT NULL,
    "commandAliasesJson" JSONB NOT NULL,
    "commandHelpText" TEXT NOT NULL,
    "dropletDefinitionJson" JSONB NOT NULL,
    "supportedEntitiesJson" JSONB NOT NULL,
    "status" "VerticalDropletStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerticalDroplet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantShell" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "verticalId" TEXT NOT NULL,
    "verticalDefinitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "configJson" JSONB NOT NULL,
    "status" "TenantShellStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantShell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantDropletAssignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "verticalDropletId" TEXT NOT NULL,
    "nameOverride" TEXT,
    "placement" TEXT,
    "configOverrideJson" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantDropletAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "title" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vertical_key_key" ON "Vertical"("key");

-- CreateIndex
CREATE INDEX "VerticalDefinition_verticalId_idx" ON "VerticalDefinition"("verticalId");

-- CreateIndex
CREATE INDEX "VerticalDefinition_verticalId_status_idx" ON "VerticalDefinition"("verticalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VerticalDefinition_verticalId_version_key" ON "VerticalDefinition"("verticalId", "version");

-- CreateIndex
CREATE INDEX "VerticalDroplet_verticalId_idx" ON "VerticalDroplet"("verticalId");

-- CreateIndex
CREATE INDEX "VerticalDroplet_verticalId_status_idx" ON "VerticalDroplet"("verticalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VerticalDroplet_verticalId_slug_key" ON "VerticalDroplet"("verticalId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "VerticalDroplet_verticalId_command_key" ON "VerticalDroplet"("verticalId", "command");

-- CreateIndex
CREATE INDEX "TenantShell_tenantId_idx" ON "TenantShell"("tenantId");

-- CreateIndex
CREATE INDEX "TenantShell_verticalId_idx" ON "TenantShell"("verticalId");

-- CreateIndex
CREATE INDEX "TenantShell_verticalDefinitionId_idx" ON "TenantShell"("verticalDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantShell_tenantId_verticalId_key" ON "TenantShell"("tenantId", "verticalId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantShell_tenantId_slug_key" ON "TenantShell"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "TenantDropletAssignment_tenantId_idx" ON "TenantDropletAssignment"("tenantId");

-- CreateIndex
CREATE INDEX "TenantDropletAssignment_tenantId_active_idx" ON "TenantDropletAssignment"("tenantId", "active");

-- CreateIndex
CREATE INDEX "TenantDropletAssignment_verticalDropletId_idx" ON "TenantDropletAssignment"("verticalDropletId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantDropletAssignment_tenantId_verticalDropletId_key" ON "TenantDropletAssignment"("tenantId", "verticalDropletId");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_tenantId_status_idx" ON "User"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE INDEX "Person_tenantId_managerId_idx" ON "Person"("tenantId", "managerId");

-- AddForeignKey
ALTER TABLE "VerticalDefinition" ADD CONSTRAINT "VerticalDefinition_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerticalDroplet" ADD CONSTRAINT "VerticalDroplet_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantShell" ADD CONSTRAINT "TenantShell_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantShell" ADD CONSTRAINT "TenantShell_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantShell" ADD CONSTRAINT "TenantShell_verticalDefinitionId_fkey" FOREIGN KEY ("verticalDefinitionId") REFERENCES "VerticalDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantDropletAssignment" ADD CONSTRAINT "TenantDropletAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantDropletAssignment" ADD CONSTRAINT "TenantDropletAssignment_verticalDropletId_fkey" FOREIGN KEY ("verticalDropletId") REFERENCES "VerticalDroplet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
