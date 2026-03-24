-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INVITED', 'INACTIVE');

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "actorUserId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authProvider" TEXT,
ADD COLUMN     "authProviderUserId" TEXT,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "globalRole" TEXT,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "metadataJson" JSONB,
ADD COLUMN     "passwordHash" TEXT;

-- AlterTable
ALTER TABLE "Vertical" ADD COLUMN     "category" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "metadataJson" JSONB,
ADD COLUMN     "updatedByUserId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "triggerHintsJson" JSONB,
    "inputSchemaJson" JSONB,
    "outputSchemaJson" JSONB,
    "toolsConfigJson" JSONB,
    "examplesJson" JSONB,
    "tagsJson" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerticalSkill" (
    "id" TEXT NOT NULL,
    "verticalId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "priority" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerticalSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "slug" TEXT NOT NULL,
    "taxId" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "currency" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "verticalId" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCompanyMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCompanyMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVerticalMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verticalId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserVerticalMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LLMProviderConfig" (
    "id" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "baseUrl" TEXT,
    "apiKeyRef" TEXT,
    "configJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LLMProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LLMModelConfig" (
    "id" TEXT NOT NULL,
    "providerConfigId" TEXT NOT NULL,
    "modelKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "temperature" DECIMAL(3,2),
    "maxTokens" INTEGER,
    "supportsTools" BOOLEAN,
    "supportsStructuredOutput" BOOLEAN,
    "configJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LLMModelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerticalLLMConfig" (
    "id" TEXT NOT NULL,
    "verticalId" TEXT NOT NULL,
    "providerConfigId" TEXT NOT NULL,
    "modelConfigId" TEXT NOT NULL,
    "purpose" TEXT,
    "systemPrompt" TEXT,
    "configJson" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerticalLLMConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailProviderConfig" (
    "id" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "host" TEXT,
    "port" INTEGER,
    "usernameRef" TEXT,
    "passwordRef" TEXT,
    "fromEmail" TEXT,
    "fromName" TEXT,
    "configJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subjectTemplate" TEXT NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "type" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- Data migration for global users, companies, and memberships
UPDATE "User"
SET
  "displayName" = COALESCE(NULLIF(TRIM("name"), ''), SPLIT_PART("email", '@', 1)),
  "firstName" = COALESCE(NULLIF(SPLIT_PART(TRIM("name"), ' ', 1), ''), SPLIT_PART("email", '@', 1)),
  "lastName" = COALESCE(NULLIF(TRIM(REGEXP_REPLACE(TRIM("name"), '^\S+\s*', '')), ''), 'User'),
  "globalRole" = COALESCE("title", "globalRole");

INSERT INTO "Company" (
  "id",
  "tenantId",
  "key",
  "name",
  "legalName",
  "slug",
  "country",
  "timezone",
  "currency",
  "status",
  "verticalId",
  "metadataJson",
  "createdAt",
  "updatedAt"
)
SELECT
  CONCAT('cmp_', SUBSTRING(MD5(t."id" || t."slug") FROM 1 FOR 24)),
  t."id",
  t."slug",
  t."name",
  CONCAT(t."name", ' Holdings'),
  t."slug",
  'US',
  t."defaultTimezone",
  t."defaultCurrency",
  CASE
    WHEN t."status" = 'ACTIVE' THEN 'ACTIVE'::"RecordStatus"
    ELSE 'INACTIVE'::"RecordStatus"
  END,
  COALESCE(shell."verticalId", fallback."id"),
  '{"migratedFromTenant": true}'::jsonb,
  t."createdAt",
  t."updatedAt"
FROM "Tenant" t
LEFT JOIN "Company" c ON c."tenantId" = t."id"
LEFT JOIN LATERAL (
  SELECT ts."verticalId"
  FROM "TenantShell" ts
  WHERE ts."tenantId" = t."id"
  ORDER BY ts."createdAt" ASC
  LIMIT 1
) shell ON TRUE
LEFT JOIN LATERAL (
  SELECT v."id"
  FROM "Vertical" v
  ORDER BY v."createdAt" ASC
  LIMIT 1
) fallback ON TRUE
WHERE c."id" IS NULL
  AND COALESCE(shell."verticalId", fallback."id") IS NOT NULL;

INSERT INTO "UserCompanyMembership" (
  "id",
  "userId",
  "companyId",
  "role",
  "status",
  "createdAt",
  "updatedAt"
)
SELECT
  CONCAT('ucm_', SUBSTRING(MD5(u."id" || c."id") FROM 1 FOR 24)),
  u."id",
  c."id",
  COALESCE(NULLIF(u."title", ''), 'member'),
  CASE
    WHEN u."status" = 'ACTIVE' THEN 'ACTIVE'::"MembershipStatus"
    WHEN u."status" = 'INVITED' THEN 'INVITED'::"MembershipStatus"
    ELSE 'INACTIVE'::"MembershipStatus"
  END,
  u."createdAt",
  u."updatedAt"
FROM "User" u
JOIN "Company" c ON c."tenantId" = u."tenantId"
WHERE NOT EXISTS (
  SELECT 1
  FROM "UserCompanyMembership" existing
  WHERE existing."userId" = u."id"
    AND existing."companyId" = c."id"
);

INSERT INTO "UserVerticalMembership" (
  "id",
  "userId",
  "verticalId",
  "role",
  "status",
  "createdAt",
  "updatedAt"
)
SELECT
  CONCAT('uvm_', SUBSTRING(MD5(u."id" || c."verticalId") FROM 1 FOR 24)),
  u."id",
  c."verticalId",
  COALESCE(NULLIF(u."title", ''), 'member'),
  CASE
    WHEN u."status" = 'ACTIVE' THEN 'ACTIVE'::"MembershipStatus"
    WHEN u."status" = 'INVITED' THEN 'INVITED'::"MembershipStatus"
    ELSE 'INACTIVE'::"MembershipStatus"
  END,
  u."createdAt",
  u."updatedAt"
FROM "User" u
JOIN "Company" c ON c."tenantId" = u."tenantId"
WHERE NOT EXISTS (
  SELECT 1
  FROM "UserVerticalMembership" existing
  WHERE existing."userId" = u."id"
    AND existing."verticalId" = c."verticalId"
);

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_tenantId_fkey";

-- DropIndex
DROP INDEX "User_tenantId_email_key";

-- DropIndex
DROP INDEX "User_tenantId_idx";

-- DropIndex
DROP INDEX "User_tenantId_status_idx";

-- Finalize global user shape
ALTER TABLE "User"
ALTER COLUMN "displayName" SET NOT NULL,
ALTER COLUMN "firstName" SET NOT NULL,
ALTER COLUMN "lastName" SET NOT NULL;

ALTER TABLE "User"
DROP COLUMN "name",
DROP COLUMN "tenantId",
DROP COLUMN "title";

-- CreateIndex
CREATE UNIQUE INDEX "Skill_key_key" ON "Skill"("key");

-- CreateIndex
CREATE INDEX "Skill_status_idx" ON "Skill"("status");

-- CreateIndex
CREATE INDEX "Skill_createdByUserId_idx" ON "Skill"("createdByUserId");

-- CreateIndex
CREATE INDEX "Skill_updatedByUserId_idx" ON "Skill"("updatedByUserId");

-- CreateIndex
CREATE INDEX "VerticalSkill_verticalId_idx" ON "VerticalSkill"("verticalId");

-- CreateIndex
CREATE INDEX "VerticalSkill_skillId_idx" ON "VerticalSkill"("skillId");

-- CreateIndex
CREATE INDEX "VerticalSkill_active_idx" ON "VerticalSkill"("active");

-- CreateIndex
CREATE UNIQUE INDEX "VerticalSkill_verticalId_skillId_key" ON "VerticalSkill"("verticalId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_tenantId_key" ON "Company"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_key_key" ON "Company"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Company_verticalId_idx" ON "Company"("verticalId");

-- CreateIndex
CREATE INDEX "Company_status_idx" ON "Company"("status");

-- CreateIndex
CREATE INDEX "Company_createdByUserId_idx" ON "Company"("createdByUserId");

-- CreateIndex
CREATE INDEX "Company_updatedByUserId_idx" ON "Company"("updatedByUserId");

-- CreateIndex
CREATE INDEX "UserCompanyMembership_userId_idx" ON "UserCompanyMembership"("userId");

-- CreateIndex
CREATE INDEX "UserCompanyMembership_companyId_idx" ON "UserCompanyMembership"("companyId");

-- CreateIndex
CREATE INDEX "UserCompanyMembership_status_idx" ON "UserCompanyMembership"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserCompanyMembership_userId_companyId_key" ON "UserCompanyMembership"("userId", "companyId");

-- CreateIndex
CREATE INDEX "UserVerticalMembership_userId_idx" ON "UserVerticalMembership"("userId");

-- CreateIndex
CREATE INDEX "UserVerticalMembership_verticalId_idx" ON "UserVerticalMembership"("verticalId");

-- CreateIndex
CREATE INDEX "UserVerticalMembership_status_idx" ON "UserVerticalMembership"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserVerticalMembership_userId_verticalId_key" ON "UserVerticalMembership"("userId", "verticalId");

-- CreateIndex
CREATE UNIQUE INDEX "LLMProviderConfig_providerKey_key" ON "LLMProviderConfig"("providerKey");

-- CreateIndex
CREATE INDEX "LLMProviderConfig_status_idx" ON "LLMProviderConfig"("status");

-- CreateIndex
CREATE INDEX "LLMModelConfig_providerConfigId_idx" ON "LLMModelConfig"("providerConfigId");

-- CreateIndex
CREATE INDEX "LLMModelConfig_status_idx" ON "LLMModelConfig"("status");

-- CreateIndex
CREATE INDEX "LLMModelConfig_providerConfigId_isDefault_idx" ON "LLMModelConfig"("providerConfigId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "LLMModelConfig_providerConfigId_modelKey_key" ON "LLMModelConfig"("providerConfigId", "modelKey");

-- CreateIndex
CREATE INDEX "VerticalLLMConfig_verticalId_idx" ON "VerticalLLMConfig"("verticalId");

-- CreateIndex
CREATE INDEX "VerticalLLMConfig_providerConfigId_idx" ON "VerticalLLMConfig"("providerConfigId");

-- CreateIndex
CREATE INDEX "VerticalLLMConfig_modelConfigId_idx" ON "VerticalLLMConfig"("modelConfigId");

-- CreateIndex
CREATE INDEX "VerticalLLMConfig_verticalId_active_idx" ON "VerticalLLMConfig"("verticalId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "EmailProviderConfig_providerKey_key" ON "EmailProviderConfig"("providerKey");

-- CreateIndex
CREATE INDEX "EmailProviderConfig_status_idx" ON "EmailProviderConfig"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_key_key" ON "EmailTemplate"("key");

-- CreateIndex
CREATE INDEX "EmailTemplate_status_idx" ON "EmailTemplate"("status");

-- CreateIndex
CREATE INDEX "EmailTemplate_type_idx" ON "EmailTemplate"("type");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_globalRole_idx" ON "User"("globalRole");

-- CreateIndex
CREATE UNIQUE INDEX "User_authProvider_authProviderUserId_key" ON "User"("authProvider", "authProviderUserId");

-- CreateIndex
CREATE INDEX "Vertical_status_idx" ON "Vertical"("status");

-- CreateIndex
CREATE INDEX "Vertical_createdByUserId_idx" ON "Vertical"("createdByUserId");

-- CreateIndex
CREATE INDEX "Vertical_updatedByUserId_idx" ON "Vertical"("updatedByUserId");

-- AddForeignKey
ALTER TABLE "Vertical" ADD CONSTRAINT "Vertical_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vertical" ADD CONSTRAINT "Vertical_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerticalSkill" ADD CONSTRAINT "VerticalSkill_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerticalSkill" ADD CONSTRAINT "VerticalSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompanyMembership" ADD CONSTRAINT "UserCompanyMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompanyMembership" ADD CONSTRAINT "UserCompanyMembership_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVerticalMembership" ADD CONSTRAINT "UserVerticalMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVerticalMembership" ADD CONSTRAINT "UserVerticalMembership_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LLMModelConfig" ADD CONSTRAINT "LLMModelConfig_providerConfigId_fkey" FOREIGN KEY ("providerConfigId") REFERENCES "LLMProviderConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerticalLLMConfig" ADD CONSTRAINT "VerticalLLMConfig_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerticalLLMConfig" ADD CONSTRAINT "VerticalLLMConfig_providerConfigId_fkey" FOREIGN KEY ("providerConfigId") REFERENCES "LLMProviderConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerticalLLMConfig" ADD CONSTRAINT "VerticalLLMConfig_modelConfigId_fkey" FOREIGN KEY ("modelConfigId") REFERENCES "LLMModelConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
