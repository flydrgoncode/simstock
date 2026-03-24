-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('PROSPECT', 'ACTIVE', 'INACTIVE', 'CHURNED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'BOOKED', 'INVOICED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('OPEN', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "ViewTemplateType" AS ENUM ('TABLE', 'CHART', 'COMPARISON', 'EDITABLE_TABLE');

-- CreateEnum
CREATE TYPE "ViewTemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "TenantViewStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'INACTIVE');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "defaultCurrency" TEXT NOT NULL,
    "defaultTimezone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "configJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT,
    "department" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "actualRevenue" DECIMAL(18,2) NOT NULL,
    "forecastRevenue" DECIMAL(18,2) NOT NULL,
    "targetRevenue" DECIMAL(18,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeadcountSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "actualHeadcount" INTEGER NOT NULL,
    "forecastHeadcount" INTEGER NOT NULL,
    "targetHeadcount" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeadcountSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "segment" TEXT,
    "geography" TEXT,
    "industry" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'PROSPECT',
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderNumber" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "productLine" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesStage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stageOrder" INTEGER NOT NULL,
    "defaultProbability" INTEGER,
    "isClosedWon" BOOLEAN NOT NULL DEFAULT false,
    "isClosedLost" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "ownerId" TEXT,
    "name" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "probability" INTEGER NOT NULL,
    "expectedCloseDate" TIMESTAMP(3),
    "source" TEXT,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityStageEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "fromStageId" TEXT,
    "toStageId" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityStageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViewTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ViewTemplateType" NOT NULL,
    "category" TEXT,
    "supportedEntitiesJson" JSONB NOT NULL,
    "definitionJson" JSONB NOT NULL,
    "status" "ViewTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ViewTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantView" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "templateId" TEXT,
    "name" TEXT NOT NULL,
    "definitionJson" JSONB NOT NULL,
    "placement" TEXT,
    "status" "TenantViewStatus" NOT NULL DEFAULT 'DRAFT',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataImportJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payloadJson" JSONB,
    "resultJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSettings_tenantId_key" ON "TenantSettings"("tenantId");

-- CreateIndex
CREATE INDEX "TenantSettings_tenantId_idx" ON "TenantSettings"("tenantId");

-- CreateIndex
CREATE INDEX "Person_tenantId_idx" ON "Person"("tenantId");

-- CreateIndex
CREATE INDEX "Person_tenantId_active_idx" ON "Person"("tenantId", "active");

-- CreateIndex
CREATE INDEX "Person_tenantId_email_idx" ON "Person"("tenantId", "email");

-- CreateIndex
CREATE INDEX "RevenueSnapshot_tenantId_idx" ON "RevenueSnapshot"("tenantId");

-- CreateIndex
CREATE INDEX "RevenueSnapshot_tenantId_month_idx" ON "RevenueSnapshot"("tenantId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueSnapshot_tenantId_month_key" ON "RevenueSnapshot"("tenantId", "month");

-- CreateIndex
CREATE INDEX "HeadcountSnapshot_tenantId_idx" ON "HeadcountSnapshot"("tenantId");

-- CreateIndex
CREATE INDEX "HeadcountSnapshot_tenantId_month_idx" ON "HeadcountSnapshot"("tenantId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "HeadcountSnapshot_tenantId_month_key" ON "HeadcountSnapshot"("tenantId", "month");

-- CreateIndex
CREATE INDEX "Customer_tenantId_idx" ON "Customer"("tenantId");

-- CreateIndex
CREATE INDEX "Customer_tenantId_status_idx" ON "Customer"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Customer_tenantId_ownerId_idx" ON "Customer"("tenantId", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_tenantId_name_key" ON "Customer"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Order_tenantId_idx" ON "Order"("tenantId");

-- CreateIndex
CREATE INDEX "Order_tenantId_customerId_idx" ON "Order"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "Order_tenantId_orderDate_idx" ON "Order"("tenantId", "orderDate");

-- CreateIndex
CREATE INDEX "Order_tenantId_status_idx" ON "Order"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Order_tenantId_orderNumber_key" ON "Order"("tenantId", "orderNumber");

-- CreateIndex
CREATE INDEX "SalesStage_tenantId_idx" ON "SalesStage"("tenantId");

-- CreateIndex
CREATE INDEX "SalesStage_tenantId_stageOrder_idx" ON "SalesStage"("tenantId", "stageOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SalesStage_tenantId_name_key" ON "SalesStage"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SalesStage_tenantId_stageOrder_key" ON "SalesStage"("tenantId", "stageOrder");

-- CreateIndex
CREATE INDEX "Opportunity_tenantId_idx" ON "Opportunity"("tenantId");

-- CreateIndex
CREATE INDEX "Opportunity_tenantId_stageId_idx" ON "Opportunity"("tenantId", "stageId");

-- CreateIndex
CREATE INDEX "Opportunity_tenantId_ownerId_idx" ON "Opportunity"("tenantId", "ownerId");

-- CreateIndex
CREATE INDEX "Opportunity_tenantId_status_idx" ON "Opportunity"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Opportunity_tenantId_expectedCloseDate_idx" ON "Opportunity"("tenantId", "expectedCloseDate");

-- CreateIndex
CREATE INDEX "OpportunityStageEvent_tenantId_idx" ON "OpportunityStageEvent"("tenantId");

-- CreateIndex
CREATE INDEX "OpportunityStageEvent_tenantId_eventDate_idx" ON "OpportunityStageEvent"("tenantId", "eventDate");

-- CreateIndex
CREATE INDEX "OpportunityStageEvent_tenantId_opportunityId_idx" ON "OpportunityStageEvent"("tenantId", "opportunityId");

-- CreateIndex
CREATE INDEX "ViewTemplate_status_idx" ON "ViewTemplate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ViewTemplate_name_key" ON "ViewTemplate"("name");

-- CreateIndex
CREATE INDEX "TenantView_tenantId_idx" ON "TenantView"("tenantId");

-- CreateIndex
CREATE INDEX "TenantView_tenantId_status_active_idx" ON "TenantView"("tenantId", "status", "active");

-- CreateIndex
CREATE INDEX "TenantView_tenantId_placement_idx" ON "TenantView"("tenantId", "placement");

-- CreateIndex
CREATE INDEX "DataImportJob_tenantId_idx" ON "DataImportJob"("tenantId");

-- CreateIndex
CREATE INDEX "DataImportJob_tenantId_status_idx" ON "DataImportJob"("tenantId", "status");

-- CreateIndex
CREATE INDEX "DataImportJob_tenantId_type_idx" ON "DataImportJob"("tenantId", "type");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "TenantSettings" ADD CONSTRAINT "TenantSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueSnapshot" ADD CONSTRAINT "RevenueSnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeadcountSnapshot" ADD CONSTRAINT "HeadcountSnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesStage" ADD CONSTRAINT "SalesStage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "SalesStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStageEvent" ADD CONSTRAINT "OpportunityStageEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStageEvent" ADD CONSTRAINT "OpportunityStageEvent_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStageEvent" ADD CONSTRAINT "OpportunityStageEvent_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "SalesStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStageEvent" ADD CONSTRAINT "OpportunityStageEvent_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "SalesStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStageEvent" ADD CONSTRAINT "OpportunityStageEvent_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantView" ADD CONSTRAINT "TenantView_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantView" ADD CONSTRAINT "TenantView_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ViewTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataImportJob" ADD CONSTRAINT "DataImportJob_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
