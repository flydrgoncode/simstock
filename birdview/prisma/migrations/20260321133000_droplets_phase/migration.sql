-- Rename view-based enums to droplet terminology
ALTER TYPE "ViewTemplateStatus" RENAME TO "DropletTemplateStatus";
ALTER TYPE "TenantViewStatus" RENAME TO "TenantDropletStatus";

-- Replace the template type enum with the new droplet type set
CREATE TYPE "DropletTemplateType" AS ENUM ('READONLY_TABLE');

-- Rename tables and JSON columns
ALTER TABLE "ViewTemplate" RENAME TO "DropletTemplate";
ALTER TABLE "TenantView" RENAME TO "TenantDroplet";

ALTER TABLE "DropletTemplate" RENAME COLUMN "definitionJson" TO "dropletDefinitionJson";
ALTER TABLE "TenantDroplet" RENAME COLUMN "definitionJson" TO "dropletDefinitionJson";

ALTER TABLE "DropletTemplate" ADD COLUMN "shellTypeId" TEXT;

ALTER TABLE "DropletTemplate" ADD COLUMN "type_new" "DropletTemplateType";
UPDATE "DropletTemplate" SET "type_new" = 'READONLY_TABLE';
ALTER TABLE "DropletTemplate" ALTER COLUMN "type_new" SET NOT NULL;
ALTER TABLE "DropletTemplate" DROP COLUMN "type";
ALTER TABLE "DropletTemplate" RENAME COLUMN "type_new" TO "type";
DROP TYPE "ViewTemplateType";

-- Rename constraints
ALTER TABLE "DropletTemplate" RENAME CONSTRAINT "ViewTemplate_pkey" TO "DropletTemplate_pkey";
ALTER TABLE "TenantDroplet" RENAME CONSTRAINT "TenantView_pkey" TO "TenantDroplet_pkey";
ALTER TABLE "TenantDroplet" RENAME CONSTRAINT "TenantView_tenantId_fkey" TO "TenantDroplet_tenantId_fkey";
ALTER TABLE "TenantDroplet" RENAME CONSTRAINT "TenantView_templateId_fkey" TO "TenantDroplet_templateId_fkey";

-- Rename indexes
ALTER INDEX "ViewTemplate_status_idx" RENAME TO "DropletTemplate_status_idx";
ALTER INDEX "ViewTemplate_name_key" RENAME TO "DropletTemplate_name_key";
ALTER INDEX "TenantView_tenantId_idx" RENAME TO "TenantDroplet_tenantId_idx";
ALTER INDEX "TenantView_tenantId_status_active_idx" RENAME TO "TenantDroplet_tenantId_status_active_idx";
ALTER INDEX "TenantView_tenantId_placement_idx" RENAME TO "TenantDroplet_tenantId_placement_idx";
