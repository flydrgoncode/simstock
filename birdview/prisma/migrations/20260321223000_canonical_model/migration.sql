-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CUSTOMER', 'SUPPLIER', 'PARTNER', 'OTHER');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('BILLING', 'SHIPPING', 'WAREHOUSE', 'OFFICE', 'OTHER');

-- CreateEnum
CREATE TYPE "SalesOrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "EcommerceChannelType" AS ENUM ('SHOPIFY', 'AMAZON', 'WEBSITE', 'MARKETPLACE', 'OTHER');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FiscalPeriodStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('GENERAL', 'SALES', 'PURCHASES', 'INVENTORY', 'OTHER');

-- CreateEnum
CREATE TYPE "LedgerAccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'COGS');

-- CreateEnum
CREATE TYPE "JournalEntryStatus" AS ENUM ('DRAFT', 'POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "PeriodGranularity" AS ENUM ('DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR');

-- CreateEnum
CREATE TYPE "MetricScope" AS ENUM ('GLOBAL', 'VERTICAL', 'TENANT');

-- CreateEnum
CREATE TYPE "MetricUnit" AS ENUM ('CURRENCY', 'NUMBER', 'PERCENTAGE', 'DAYS');

-- CreateEnum
CREATE TYPE "MetricAggregationMethod" AS ENUM ('SUM', 'AVG', 'LAST', 'COUNT', 'RATIO');

-- CreateEnum
CREATE TYPE "MetricScenario" AS ENUM ('ACTUAL', 'FORECAST', 'TARGET', 'BUDGET', 'PLAN');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('TARGET', 'BUDGET', 'FORECAST', 'PLAN');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PHYSICAL', 'DIGITAL', 'SERVICE');

-- CreateEnum
CREATE TYPE "MarketingAssetType" AS ENUM ('ARTICLE', 'POST', 'VIDEO', 'AD', 'EMAIL', 'LANDING_PAGE_COPY', 'OTHER');

-- CreateEnum
CREATE TYPE "CommandScope" AS ENUM ('GLOBAL', 'VERTICAL', 'TENANT', 'DROPLET');

-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'SUSPENDED';

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "HeadcountSnapshot" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "timePeriodId" TEXT;

-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "primaryContactId" TEXT;

-- AlterTable
ALTER TABLE "OpportunityStageEvent" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "RevenueSnapshot" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "timePeriodId" TEXT;

-- AlterTable
ALTER TABLE "TenantDropletAssignment" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "VerticalDroplet" ADD COLUMN     "authorHintText" TEXT,
ADD COLUMN     "generationPromptVersion" TEXT,
ADD COLUMN     "generationStatus" TEXT NOT NULL DEFAULT 'READY',
ADD COLUMN     "generationWarningsJson" JSONB,
ADD COLUMN     "previewDummyDataConfigJson" JSONB,
ADD COLUMN     "shadowSkillDefinitionJson" JSONB,
ALTER COLUMN "commandAliasesJson" DROP NOT NULL,
ALTER COLUMN "commandHelpText" DROP NOT NULL,
ALTER COLUMN "supportedEntitiesJson" DROP NOT NULL;

-- CreateTable
CREATE TABLE "OrgUnit" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentOrgUnitId" TEXT,
    "managerPersonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orgUnitId" TEXT,
    "managerPersonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "taxId" TEXT,
    "segment" TEXT,
    "geography" TEXT,
    "industry" TEXT,
    "ownerPersonId" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "accountId" TEXT,
    "addressType" "AddressType" NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "accountId" TEXT,
    "contactId" TEXT,
    "source" TEXT,
    "name" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "ownerPersonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityStage" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stageOrder" INTEGER NOT NULL,
    "defaultProbability" INTEGER,
    "isClosedWon" BOOLEAN NOT NULL DEFAULT false,
    "isClosedLost" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "quoteDate" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteLine" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(18,2) NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "lineAmount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcommerceChannel" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EcommerceChannelType" NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EcommerceChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "accountId" TEXT,
    "channelId" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartLine" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(18,2) NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "orderNumber" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "channelId" TEXT,
    "billingAddressId" TEXT,
    "shippingAddressId" TEXT,
    "status" "SalesOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotalAmount" DECIMAL(18,2) NOT NULL,
    "taxAmount" DECIMAL(18,2) NOT NULL,
    "shippingAmount" DECIMAL(18,2) NOT NULL,
    "discountAmount" DECIMAL(18,2) NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderLine" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "productId" TEXT,
    "sku" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(18,2) NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "discountAmount" DECIMAL(18,2) NOT NULL,
    "taxAmount" DECIMAL(18,2) NOT NULL,
    "lineTotalAmount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fulfillment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "shippedDate" TIMESTAMP(3),
    "deliveredDate" TIMESTAMP(3),
    "carrier" TEXT,
    "trackingNumber" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fulfillment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesReturn" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "refundAmount" DECIMAL(18,2),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentCategoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT,
    "brand" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "productType" "ProductType" NOT NULL,
    "defaultUom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceList" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "addressId" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "onHandQty" DECIMAL(18,2) NOT NULL,
    "reservedQty" DECIMAL(18,2) NOT NULL,
    "availableQty" DECIMAL(18,2) NOT NULL,
    "reorderPoint" DECIMAL(18,2),
    "reorderQty" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "quantity" DECIMAL(18,2) NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "referenceEntityType" TEXT,
    "referenceEntityId" TEXT,
    "unitCost" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "adjustmentDate" TIMESTAMP(3) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAdjustmentLine" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stockAdjustmentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantityDelta" DECIMAL(18,2) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockAdjustmentLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransfer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fromWarehouseId" TEXT NOT NULL,
    "toWarehouseId" TEXT NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransferLine" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "inventoryTransferId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryTransferLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "supplierAccountId" TEXT NOT NULL,
    "purchaseOrderNumber" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "expectedReceiptDate" TIMESTAMP(3),
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotalAmount" DECIMAL(18,2) NOT NULL,
    "taxAmount" DECIMAL(18,2) NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderLine" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(18,2) NOT NULL,
    "unitCost" DECIMAL(18,2) NOT NULL,
    "lineAmount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "supplierAccountId" TEXT,
    "warehouseId" TEXT NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptLine" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "goodsReceiptId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantityReceived" DECIMAL(18,2) NOT NULL,
    "unitCost" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReceiptLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalPeriod" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "periodCode" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "FiscalPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "type" "LedgerType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountType" "LedgerAccountType" NOT NULL,
    "parentAccountId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "fiscalPeriodId" TEXT,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "status" "JournalEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntryLine" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "ledgerAccountId" TEXT NOT NULL,
    "debitAmount" DECIMAL(18,2) NOT NULL,
    "creditAmount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT,
    "referenceEntityType" TEXT,
    "referenceEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntryLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "salesOrderId" TEXT,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "subtotalAmount" DECIMAL(18,2) NOT NULL,
    "taxAmount" DECIMAL(18,2) NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(18,2) NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "lineAmount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "paymentMethod" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "supplierAccountId" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "category" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimePeriod" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "granularity" "PeriodGranularity" NOT NULL,
    "periodKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER,
    "month" INTEGER,
    "week" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricDefinition" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "scope" "MetricScope" NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" "MetricUnit" NOT NULL,
    "aggregationMethod" "MetricAggregationMethod" NOT NULL,
    "entityType" TEXT,

    CONSTRAINT "MetricDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricSeries" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "metricDefinitionId" TEXT NOT NULL,
    "dimensionJson" JSONB,
    "ownerEntityType" TEXT,
    "ownerEntityId" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "MetricSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricPoint" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "metricSeriesId" TEXT NOT NULL,
    "timePeriodId" TEXT NOT NULL,
    "scenario" "MetricScenario" NOT NULL,
    "value" DECIMAL(18,2) NOT NULL,
    "version" TEXT,
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetricPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastModel" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "metricSeriesId" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "parametersJson" JSONB,
    "outputVersion" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForecastModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanVersion" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PlanType" NOT NULL,
    "year" INTEGER,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "createdByPersonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingWorkspace" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingCampaign" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "name" TEXT NOT NULL,
    "objective" TEXT,
    "channel" TEXT,
    "budget" DECIMAL(18,2),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAsset" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "campaignId" TEXT,
    "type" "MarketingAssetType" NOT NULL,
    "title" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "uri" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "campaignId" TEXT,
    "contentAssetId" TEXT,
    "channel" TEXT NOT NULL,
    "publishDate" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "impressions" INTEGER,
    "clicks" INTEGER,
    "engagements" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingPage" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "campaignId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingContact" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "accountId" TEXT,
    "email" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "source" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingLead" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT,
    "campaignId" TEXT,
    "source" TEXT,
    "score" INTEGER,
    "lifecycleStage" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunnelStageDefinition" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stageOrder" INTEGER NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FunnelStageDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunnelEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "campaignId" TEXT,
    "funnelStageId" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(18,2),
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FunnelEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "storageRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "meetingId" TEXT,
    "documentId" TEXT,
    "content" TEXT NOT NULL,
    "language" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "authorPersonId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerPersonId" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "decisionDate" TIMESTAMP(3) NOT NULL,
    "ownerPersonId" TEXT,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "probability" TEXT NOT NULL,
    "ownerPersonId" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityLink" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fromEntityType" TEXT NOT NULL,
    "fromEntityId" TEXT NOT NULL,
    "toEntityType" TEXT NOT NULL,
    "toEntityId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "confidence" DECIMAL(5,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntityLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "subjectEntityType" TEXT NOT NULL,
    "subjectEntityId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sourceRefsJson" JSONB,
    "confidence" DECIMAL(5,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueryContext" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "contextJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueryContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommandDefinition" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "scope" "CommandScope" NOT NULL,
    "scopeRefId" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "aliasesJson" JSONB,
    "helpText" TEXT NOT NULL,
    "handlerType" TEXT NOT NULL,
    "handlerConfigJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommandDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillDefinition" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "scope" "CommandScope" NOT NULL,
    "scopeRefId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "configJson" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrgUnit_companyId_idx" ON "OrgUnit"("companyId");

-- CreateIndex
CREATE INDEX "OrgUnit_parentOrgUnitId_idx" ON "OrgUnit"("parentOrgUnitId");

-- CreateIndex
CREATE INDEX "OrgUnit_managerPersonId_idx" ON "OrgUnit"("managerPersonId");

-- CreateIndex
CREATE INDEX "Team_companyId_idx" ON "Team"("companyId");

-- CreateIndex
CREATE INDEX "Team_orgUnitId_idx" ON "Team"("orgUnitId");

-- CreateIndex
CREATE INDEX "Team_managerPersonId_idx" ON "Team"("managerPersonId");

-- CreateIndex
CREATE INDEX "Account_companyId_idx" ON "Account"("companyId");

-- CreateIndex
CREATE INDEX "Account_ownerPersonId_idx" ON "Account"("ownerPersonId");

-- CreateIndex
CREATE INDEX "Account_status_idx" ON "Account"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Account_companyId_name_key" ON "Account"("companyId", "name");

-- CreateIndex
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");

-- CreateIndex
CREATE INDEX "Contact_accountId_idx" ON "Contact"("accountId");

-- CreateIndex
CREATE INDEX "Contact_status_idx" ON "Contact"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_companyId_accountId_email_key" ON "Contact"("companyId", "accountId", "email");

-- CreateIndex
CREATE INDEX "Address_companyId_idx" ON "Address"("companyId");

-- CreateIndex
CREATE INDEX "Address_accountId_idx" ON "Address"("accountId");

-- CreateIndex
CREATE INDEX "Lead_companyId_idx" ON "Lead"("companyId");

-- CreateIndex
CREATE INDEX "Lead_accountId_idx" ON "Lead"("accountId");

-- CreateIndex
CREATE INDEX "Lead_contactId_idx" ON "Lead"("contactId");

-- CreateIndex
CREATE INDEX "Lead_ownerPersonId_idx" ON "Lead"("ownerPersonId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "OpportunityStage_companyId_idx" ON "OpportunityStage"("companyId");

-- CreateIndex
CREATE INDEX "OpportunityStage_companyId_stageOrder_idx" ON "OpportunityStage"("companyId", "stageOrder");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityStage_companyId_name_key" ON "OpportunityStage"("companyId", "name");

-- CreateIndex
CREATE INDEX "Quote_companyId_idx" ON "Quote"("companyId");

-- CreateIndex
CREATE INDEX "Quote_accountId_idx" ON "Quote"("accountId");

-- CreateIndex
CREATE INDEX "Quote_opportunityId_idx" ON "Quote"("opportunityId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE INDEX "QuoteLine_companyId_idx" ON "QuoteLine"("companyId");

-- CreateIndex
CREATE INDEX "QuoteLine_quoteId_idx" ON "QuoteLine"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteLine_productId_idx" ON "QuoteLine"("productId");

-- CreateIndex
CREATE INDEX "EcommerceChannel_companyId_idx" ON "EcommerceChannel"("companyId");

-- CreateIndex
CREATE INDEX "EcommerceChannel_status_idx" ON "EcommerceChannel"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EcommerceChannel_companyId_name_key" ON "EcommerceChannel"("companyId", "name");

-- CreateIndex
CREATE INDEX "Cart_companyId_idx" ON "Cart"("companyId");

-- CreateIndex
CREATE INDEX "Cart_accountId_idx" ON "Cart"("accountId");

-- CreateIndex
CREATE INDEX "Cart_channelId_idx" ON "Cart"("channelId");

-- CreateIndex
CREATE INDEX "Cart_status_idx" ON "Cart"("status");

-- CreateIndex
CREATE INDEX "CartLine_companyId_idx" ON "CartLine"("companyId");

-- CreateIndex
CREATE INDEX "CartLine_cartId_idx" ON "CartLine"("cartId");

-- CreateIndex
CREATE INDEX "CartLine_productId_idx" ON "CartLine"("productId");

-- CreateIndex
CREATE INDEX "SalesOrder_companyId_idx" ON "SalesOrder"("companyId");

-- CreateIndex
CREATE INDEX "SalesOrder_accountId_idx" ON "SalesOrder"("accountId");

-- CreateIndex
CREATE INDEX "SalesOrder_opportunityId_idx" ON "SalesOrder"("opportunityId");

-- CreateIndex
CREATE INDEX "SalesOrder_channelId_idx" ON "SalesOrder"("channelId");

-- CreateIndex
CREATE INDEX "SalesOrder_status_idx" ON "SalesOrder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_companyId_orderNumber_key" ON "SalesOrder"("companyId", "orderNumber");

-- CreateIndex
CREATE INDEX "SalesOrderLine_companyId_idx" ON "SalesOrderLine"("companyId");

-- CreateIndex
CREATE INDEX "SalesOrderLine_salesOrderId_idx" ON "SalesOrderLine"("salesOrderId");

-- CreateIndex
CREATE INDEX "SalesOrderLine_productId_idx" ON "SalesOrderLine"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrderLine_companyId_salesOrderId_description_key" ON "SalesOrderLine"("companyId", "salesOrderId", "description");

-- CreateIndex
CREATE INDEX "Fulfillment_companyId_idx" ON "Fulfillment"("companyId");

-- CreateIndex
CREATE INDEX "Fulfillment_salesOrderId_idx" ON "Fulfillment"("salesOrderId");

-- CreateIndex
CREATE INDEX "Fulfillment_warehouseId_idx" ON "Fulfillment"("warehouseId");

-- CreateIndex
CREATE INDEX "Fulfillment_status_idx" ON "Fulfillment"("status");

-- CreateIndex
CREATE INDEX "SalesReturn_companyId_idx" ON "SalesReturn"("companyId");

-- CreateIndex
CREATE INDEX "SalesReturn_salesOrderId_idx" ON "SalesReturn"("salesOrderId");

-- CreateIndex
CREATE INDEX "SalesReturn_status_idx" ON "SalesReturn"("status");

-- CreateIndex
CREATE INDEX "ProductCategory_companyId_idx" ON "ProductCategory"("companyId");

-- CreateIndex
CREATE INDEX "ProductCategory_parentCategoryId_idx" ON "ProductCategory"("parentCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_companyId_name_key" ON "ProductCategory"("companyId", "name");

-- CreateIndex
CREATE INDEX "Product_companyId_idx" ON "Product"("companyId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Product_companyId_sku_key" ON "Product"("companyId", "sku");

-- CreateIndex
CREATE INDEX "PriceList_companyId_idx" ON "PriceList"("companyId");

-- CreateIndex
CREATE INDEX "PriceList_status_idx" ON "PriceList"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PriceList_companyId_name_key" ON "PriceList"("companyId", "name");

-- CreateIndex
CREATE INDEX "PriceListItem_companyId_idx" ON "PriceListItem"("companyId");

-- CreateIndex
CREATE INDEX "PriceListItem_priceListId_idx" ON "PriceListItem"("priceListId");

-- CreateIndex
CREATE INDEX "PriceListItem_productId_idx" ON "PriceListItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceListItem_companyId_priceListId_productId_key" ON "PriceListItem"("companyId", "priceListId", "productId");

-- CreateIndex
CREATE INDEX "Warehouse_companyId_idx" ON "Warehouse"("companyId");

-- CreateIndex
CREATE INDEX "Warehouse_addressId_idx" ON "Warehouse"("addressId");

-- CreateIndex
CREATE INDEX "Warehouse_status_idx" ON "Warehouse"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_companyId_name_key" ON "Warehouse"("companyId", "name");

-- CreateIndex
CREATE INDEX "InventoryItem_companyId_idx" ON "InventoryItem"("companyId");

-- CreateIndex
CREATE INDEX "InventoryItem_productId_idx" ON "InventoryItem"("productId");

-- CreateIndex
CREATE INDEX "InventoryItem_warehouseId_idx" ON "InventoryItem"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_companyId_productId_warehouseId_key" ON "InventoryItem"("companyId", "productId", "warehouseId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_companyId_idx" ON "InventoryTransaction"("companyId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_productId_idx" ON "InventoryTransaction"("productId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_warehouseId_idx" ON "InventoryTransaction"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_transactionDate_idx" ON "InventoryTransaction"("transactionDate");

-- CreateIndex
CREATE INDEX "StockAdjustment_companyId_idx" ON "StockAdjustment"("companyId");

-- CreateIndex
CREATE INDEX "StockAdjustment_warehouseId_idx" ON "StockAdjustment"("warehouseId");

-- CreateIndex
CREATE INDEX "StockAdjustment_status_idx" ON "StockAdjustment"("status");

-- CreateIndex
CREATE INDEX "StockAdjustmentLine_companyId_idx" ON "StockAdjustmentLine"("companyId");

-- CreateIndex
CREATE INDEX "StockAdjustmentLine_stockAdjustmentId_idx" ON "StockAdjustmentLine"("stockAdjustmentId");

-- CreateIndex
CREATE INDEX "StockAdjustmentLine_productId_idx" ON "StockAdjustmentLine"("productId");

-- CreateIndex
CREATE INDEX "InventoryTransfer_companyId_idx" ON "InventoryTransfer"("companyId");

-- CreateIndex
CREATE INDEX "InventoryTransfer_fromWarehouseId_idx" ON "InventoryTransfer"("fromWarehouseId");

-- CreateIndex
CREATE INDEX "InventoryTransfer_toWarehouseId_idx" ON "InventoryTransfer"("toWarehouseId");

-- CreateIndex
CREATE INDEX "InventoryTransfer_status_idx" ON "InventoryTransfer"("status");

-- CreateIndex
CREATE INDEX "InventoryTransferLine_companyId_idx" ON "InventoryTransferLine"("companyId");

-- CreateIndex
CREATE INDEX "InventoryTransferLine_inventoryTransferId_idx" ON "InventoryTransferLine"("inventoryTransferId");

-- CreateIndex
CREATE INDEX "InventoryTransferLine_productId_idx" ON "InventoryTransferLine"("productId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_companyId_idx" ON "PurchaseOrder"("companyId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplierAccountId_idx" ON "PurchaseOrder"("supplierAccountId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrderLine_companyId_idx" ON "PurchaseOrderLine"("companyId");

-- CreateIndex
CREATE INDEX "PurchaseOrderLine_purchaseOrderId_idx" ON "PurchaseOrderLine"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderLine_productId_idx" ON "PurchaseOrderLine"("productId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_companyId_idx" ON "GoodsReceipt"("companyId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_purchaseOrderId_idx" ON "GoodsReceipt"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_supplierAccountId_idx" ON "GoodsReceipt"("supplierAccountId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_warehouseId_idx" ON "GoodsReceipt"("warehouseId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_status_idx" ON "GoodsReceipt"("status");

-- CreateIndex
CREATE INDEX "GoodsReceiptLine_companyId_idx" ON "GoodsReceiptLine"("companyId");

-- CreateIndex
CREATE INDEX "GoodsReceiptLine_goodsReceiptId_idx" ON "GoodsReceiptLine"("goodsReceiptId");

-- CreateIndex
CREATE INDEX "GoodsReceiptLine_productId_idx" ON "GoodsReceiptLine"("productId");

-- CreateIndex
CREATE INDEX "FiscalPeriod_companyId_idx" ON "FiscalPeriod"("companyId");

-- CreateIndex
CREATE INDEX "FiscalPeriod_status_idx" ON "FiscalPeriod"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalPeriod_companyId_periodCode_key" ON "FiscalPeriod"("companyId", "periodCode");

-- CreateIndex
CREATE INDEX "Ledger_companyId_idx" ON "Ledger"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_companyId_name_key" ON "Ledger"("companyId", "name");

-- CreateIndex
CREATE INDEX "LedgerAccount_companyId_idx" ON "LedgerAccount"("companyId");

-- CreateIndex
CREATE INDEX "LedgerAccount_ledgerId_idx" ON "LedgerAccount"("ledgerId");

-- CreateIndex
CREATE INDEX "LedgerAccount_parentAccountId_idx" ON "LedgerAccount"("parentAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_companyId_ledgerId_accountCode_key" ON "LedgerAccount"("companyId", "ledgerId", "accountCode");

-- CreateIndex
CREATE INDEX "JournalEntry_companyId_idx" ON "JournalEntry"("companyId");

-- CreateIndex
CREATE INDEX "JournalEntry_ledgerId_idx" ON "JournalEntry"("ledgerId");

-- CreateIndex
CREATE INDEX "JournalEntry_fiscalPeriodId_idx" ON "JournalEntry"("fiscalPeriodId");

-- CreateIndex
CREATE INDEX "JournalEntry_status_idx" ON "JournalEntry"("status");

-- CreateIndex
CREATE INDEX "JournalEntryLine_companyId_idx" ON "JournalEntryLine"("companyId");

-- CreateIndex
CREATE INDEX "JournalEntryLine_journalEntryId_idx" ON "JournalEntryLine"("journalEntryId");

-- CreateIndex
CREATE INDEX "JournalEntryLine_ledgerAccountId_idx" ON "JournalEntryLine"("ledgerAccountId");

-- CreateIndex
CREATE INDEX "Invoice_companyId_idx" ON "Invoice"("companyId");

-- CreateIndex
CREATE INDEX "Invoice_accountId_idx" ON "Invoice"("accountId");

-- CreateIndex
CREATE INDEX "Invoice_salesOrderId_idx" ON "Invoice"("salesOrderId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "InvoiceLine_companyId_idx" ON "InvoiceLine"("companyId");

-- CreateIndex
CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceLine_productId_idx" ON "InvoiceLine"("productId");

-- CreateIndex
CREATE INDEX "Payment_companyId_idx" ON "Payment"("companyId");

-- CreateIndex
CREATE INDEX "Payment_accountId_idx" ON "Payment"("accountId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Expense_companyId_idx" ON "Expense"("companyId");

-- CreateIndex
CREATE INDEX "Expense_supplierAccountId_idx" ON "Expense"("supplierAccountId");

-- CreateIndex
CREATE INDEX "Expense_status_idx" ON "Expense"("status");

-- CreateIndex
CREATE INDEX "TimePeriod_companyId_idx" ON "TimePeriod"("companyId");

-- CreateIndex
CREATE INDEX "TimePeriod_granularity_idx" ON "TimePeriod"("granularity");

-- CreateIndex
CREATE UNIQUE INDEX "TimePeriod_companyId_granularity_periodKey_key" ON "TimePeriod"("companyId", "granularity", "periodKey");

-- CreateIndex
CREATE INDEX "MetricDefinition_companyId_idx" ON "MetricDefinition"("companyId");

-- CreateIndex
CREATE INDEX "MetricDefinition_scope_idx" ON "MetricDefinition"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "MetricDefinition_companyId_key_key" ON "MetricDefinition"("companyId", "key");

-- CreateIndex
CREATE INDEX "MetricSeries_companyId_idx" ON "MetricSeries"("companyId");

-- CreateIndex
CREATE INDEX "MetricSeries_metricDefinitionId_idx" ON "MetricSeries"("metricDefinitionId");

-- CreateIndex
CREATE INDEX "MetricSeries_status_idx" ON "MetricSeries"("status");

-- CreateIndex
CREATE INDEX "MetricPoint_companyId_idx" ON "MetricPoint"("companyId");

-- CreateIndex
CREATE INDEX "MetricPoint_metricSeriesId_idx" ON "MetricPoint"("metricSeriesId");

-- CreateIndex
CREATE INDEX "MetricPoint_timePeriodId_idx" ON "MetricPoint"("timePeriodId");

-- CreateIndex
CREATE INDEX "ForecastModel_companyId_idx" ON "ForecastModel"("companyId");

-- CreateIndex
CREATE INDEX "ForecastModel_metricSeriesId_idx" ON "ForecastModel"("metricSeriesId");

-- CreateIndex
CREATE INDEX "ForecastModel_status_idx" ON "ForecastModel"("status");

-- CreateIndex
CREATE INDEX "PlanVersion_companyId_idx" ON "PlanVersion"("companyId");

-- CreateIndex
CREATE INDEX "PlanVersion_createdByPersonId_idx" ON "PlanVersion"("createdByPersonId");

-- CreateIndex
CREATE INDEX "PlanVersion_status_idx" ON "PlanVersion"("status");

-- CreateIndex
CREATE INDEX "MarketingWorkspace_companyId_idx" ON "MarketingWorkspace"("companyId");

-- CreateIndex
CREATE INDEX "MarketingWorkspace_status_idx" ON "MarketingWorkspace"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingWorkspace_companyId_name_key" ON "MarketingWorkspace"("companyId", "name");

-- CreateIndex
CREATE INDEX "MarketingCampaign_companyId_idx" ON "MarketingCampaign"("companyId");

-- CreateIndex
CREATE INDEX "MarketingCampaign_workspaceId_idx" ON "MarketingCampaign"("workspaceId");

-- CreateIndex
CREATE INDEX "MarketingCampaign_status_idx" ON "MarketingCampaign"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingCampaign_companyId_name_key" ON "MarketingCampaign"("companyId", "name");

-- CreateIndex
CREATE INDEX "ContentAsset_companyId_idx" ON "ContentAsset"("companyId");

-- CreateIndex
CREATE INDEX "ContentAsset_workspaceId_idx" ON "ContentAsset"("workspaceId");

-- CreateIndex
CREATE INDEX "ContentAsset_campaignId_idx" ON "ContentAsset"("campaignId");

-- CreateIndex
CREATE INDEX "ContentAsset_status_idx" ON "ContentAsset"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ContentAsset_companyId_title_key" ON "ContentAsset"("companyId", "title");

-- CreateIndex
CREATE INDEX "SocialPost_companyId_idx" ON "SocialPost"("companyId");

-- CreateIndex
CREATE INDEX "SocialPost_campaignId_idx" ON "SocialPost"("campaignId");

-- CreateIndex
CREATE INDEX "SocialPost_contentAssetId_idx" ON "SocialPost"("contentAssetId");

-- CreateIndex
CREATE INDEX "SocialPost_status_idx" ON "SocialPost"("status");

-- CreateIndex
CREATE INDEX "LandingPage_companyId_idx" ON "LandingPage"("companyId");

-- CreateIndex
CREATE INDEX "LandingPage_campaignId_idx" ON "LandingPage"("campaignId");

-- CreateIndex
CREATE INDEX "LandingPage_status_idx" ON "LandingPage"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LandingPage_companyId_slug_key" ON "LandingPage"("companyId", "slug");

-- CreateIndex
CREATE INDEX "MarketingContact_companyId_idx" ON "MarketingContact"("companyId");

-- CreateIndex
CREATE INDEX "MarketingContact_accountId_idx" ON "MarketingContact"("accountId");

-- CreateIndex
CREATE INDEX "MarketingContact_status_idx" ON "MarketingContact"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingContact_companyId_email_key" ON "MarketingContact"("companyId", "email");

-- CreateIndex
CREATE INDEX "MarketingLead_companyId_idx" ON "MarketingLead"("companyId");

-- CreateIndex
CREATE INDEX "MarketingLead_contactId_idx" ON "MarketingLead"("contactId");

-- CreateIndex
CREATE INDEX "MarketingLead_campaignId_idx" ON "MarketingLead"("campaignId");

-- CreateIndex
CREATE INDEX "MarketingLead_status_idx" ON "MarketingLead"("status");

-- CreateIndex
CREATE INDEX "FunnelStageDefinition_companyId_idx" ON "FunnelStageDefinition"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "FunnelStageDefinition_companyId_name_key" ON "FunnelStageDefinition"("companyId", "name");

-- CreateIndex
CREATE INDEX "FunnelEvent_companyId_idx" ON "FunnelEvent"("companyId");

-- CreateIndex
CREATE INDEX "FunnelEvent_contactId_idx" ON "FunnelEvent"("contactId");

-- CreateIndex
CREATE INDEX "FunnelEvent_leadId_idx" ON "FunnelEvent"("leadId");

-- CreateIndex
CREATE INDEX "FunnelEvent_campaignId_idx" ON "FunnelEvent"("campaignId");

-- CreateIndex
CREATE INDEX "FunnelEvent_funnelStageId_idx" ON "FunnelEvent"("funnelStageId");

-- CreateIndex
CREATE INDEX "FunnelEvent_eventDate_idx" ON "FunnelEvent"("eventDate");

-- CreateIndex
CREATE INDEX "Document_companyId_idx" ON "Document"("companyId");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- CreateIndex
CREATE INDEX "Meeting_companyId_idx" ON "Meeting"("companyId");

-- CreateIndex
CREATE INDEX "Meeting_status_idx" ON "Meeting"("status");

-- CreateIndex
CREATE INDEX "Transcript_companyId_idx" ON "Transcript"("companyId");

-- CreateIndex
CREATE INDEX "Transcript_meetingId_idx" ON "Transcript"("meetingId");

-- CreateIndex
CREATE INDEX "Transcript_documentId_idx" ON "Transcript"("documentId");

-- CreateIndex
CREATE INDEX "Note_companyId_idx" ON "Note"("companyId");

-- CreateIndex
CREATE INDEX "Note_authorPersonId_idx" ON "Note"("authorPersonId");

-- CreateIndex
CREATE INDEX "Note_entityType_entityId_idx" ON "Note"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Task_companyId_idx" ON "Task"("companyId");

-- CreateIndex
CREATE INDEX "Task_ownerPersonId_idx" ON "Task"("ownerPersonId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Decision_companyId_idx" ON "Decision"("companyId");

-- CreateIndex
CREATE INDEX "Decision_ownerPersonId_idx" ON "Decision"("ownerPersonId");

-- CreateIndex
CREATE INDEX "Risk_companyId_idx" ON "Risk"("companyId");

-- CreateIndex
CREATE INDEX "Risk_ownerPersonId_idx" ON "Risk"("ownerPersonId");

-- CreateIndex
CREATE INDEX "Risk_status_idx" ON "Risk"("status");

-- CreateIndex
CREATE INDEX "EntityLink_companyId_idx" ON "EntityLink"("companyId");

-- CreateIndex
CREATE INDEX "EntityLink_fromEntityType_fromEntityId_idx" ON "EntityLink"("fromEntityType", "fromEntityId");

-- CreateIndex
CREATE INDEX "EntityLink_toEntityType_toEntityId_idx" ON "EntityLink"("toEntityType", "toEntityId");

-- CreateIndex
CREATE INDEX "Observation_companyId_idx" ON "Observation"("companyId");

-- CreateIndex
CREATE INDEX "Observation_subjectEntityType_subjectEntityId_idx" ON "Observation"("subjectEntityType", "subjectEntityId");

-- CreateIndex
CREATE INDEX "QueryContext_companyId_idx" ON "QueryContext"("companyId");

-- CreateIndex
CREATE INDEX "QueryContext_userId_idx" ON "QueryContext"("userId");

-- CreateIndex
CREATE INDEX "CommandDefinition_companyId_idx" ON "CommandDefinition"("companyId");

-- CreateIndex
CREATE INDEX "CommandDefinition_scope_scopeRefId_idx" ON "CommandDefinition"("scope", "scopeRefId");

-- CreateIndex
CREATE INDEX "SkillDefinition_companyId_idx" ON "SkillDefinition"("companyId");

-- CreateIndex
CREATE INDEX "SkillDefinition_scope_scopeRefId_idx" ON "SkillDefinition"("scope", "scopeRefId");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_idx" ON "AuditLog"("companyId");

-- CreateIndex
CREATE INDEX "HeadcountSnapshot_companyId_idx" ON "HeadcountSnapshot"("companyId");

-- CreateIndex
CREATE INDEX "HeadcountSnapshot_timePeriodId_idx" ON "HeadcountSnapshot"("timePeriodId");

-- CreateIndex
CREATE INDEX "Opportunity_companyId_idx" ON "Opportunity"("companyId");

-- CreateIndex
CREATE INDEX "Opportunity_accountId_idx" ON "Opportunity"("accountId");

-- CreateIndex
CREATE INDEX "Opportunity_primaryContactId_idx" ON "Opportunity"("primaryContactId");

-- CreateIndex
CREATE INDEX "OpportunityStageEvent_companyId_idx" ON "OpportunityStageEvent"("companyId");

-- CreateIndex
CREATE INDEX "Person_companyId_idx" ON "Person"("companyId");

-- CreateIndex
CREATE INDEX "RevenueSnapshot_companyId_idx" ON "RevenueSnapshot"("companyId");

-- CreateIndex
CREATE INDEX "RevenueSnapshot_timePeriodId_idx" ON "RevenueSnapshot"("timePeriodId");

-- CreateIndex
CREATE INDEX "TenantDropletAssignment_companyId_idx" ON "TenantDropletAssignment"("companyId");

-- AddForeignKey
ALTER TABLE "TenantDropletAssignment" ADD CONSTRAINT "TenantDropletAssignment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueSnapshot" ADD CONSTRAINT "RevenueSnapshot_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueSnapshot" ADD CONSTRAINT "RevenueSnapshot_timePeriodId_fkey" FOREIGN KEY ("timePeriodId") REFERENCES "TimePeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeadcountSnapshot" ADD CONSTRAINT "HeadcountSnapshot_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeadcountSnapshot" ADD CONSTRAINT "HeadcountSnapshot_timePeriodId_fkey" FOREIGN KEY ("timePeriodId") REFERENCES "TimePeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStageEvent" ADD CONSTRAINT "OpportunityStageEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgUnit" ADD CONSTRAINT "OrgUnit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgUnit" ADD CONSTRAINT "OrgUnit_parentOrgUnitId_fkey" FOREIGN KEY ("parentOrgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgUnit" ADD CONSTRAINT "OrgUnit_managerPersonId_fkey" FOREIGN KEY ("managerPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_managerPersonId_fkey" FOREIGN KEY ("managerPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_ownerPersonId_fkey" FOREIGN KEY ("ownerPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerPersonId_fkey" FOREIGN KEY ("ownerPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStage" ADD CONSTRAINT "OpportunityStage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcommerceChannel" ADD CONSTRAINT "EcommerceChannel_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "EcommerceChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartLine" ADD CONSTRAINT "CartLine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartLine" ADD CONSTRAINT "CartLine_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartLine" ADD CONSTRAINT "CartLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "EcommerceChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderLine" ADD CONSTRAINT "SalesOrderLine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderLine" ADD CONSTRAINT "SalesOrderLine_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderLine" ADD CONSTRAINT "SalesOrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fulfillment" ADD CONSTRAINT "Fulfillment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fulfillment" ADD CONSTRAINT "Fulfillment_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fulfillment" ADD CONSTRAINT "Fulfillment_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceList" ADD CONSTRAINT "PriceList_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustmentLine" ADD CONSTRAINT "StockAdjustmentLine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustmentLine" ADD CONSTRAINT "StockAdjustmentLine_stockAdjustmentId_fkey" FOREIGN KEY ("stockAdjustmentId") REFERENCES "StockAdjustment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustmentLine" ADD CONSTRAINT "StockAdjustmentLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransferLine" ADD CONSTRAINT "InventoryTransferLine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransferLine" ADD CONSTRAINT "InventoryTransferLine_inventoryTransferId_fkey" FOREIGN KEY ("inventoryTransferId") REFERENCES "InventoryTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransferLine" ADD CONSTRAINT "InventoryTransferLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierAccountId_fkey" FOREIGN KEY ("supplierAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_supplierAccountId_fkey" FOREIGN KEY ("supplierAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalPeriod" ADD CONSTRAINT "FiscalPeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_parentAccountId_fkey" FOREIGN KEY ("parentAccountId") REFERENCES "LedgerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "FiscalPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntryLine" ADD CONSTRAINT "JournalEntryLine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntryLine" ADD CONSTRAINT "JournalEntryLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntryLine" ADD CONSTRAINT "JournalEntryLine_ledgerAccountId_fkey" FOREIGN KEY ("ledgerAccountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_supplierAccountId_fkey" FOREIGN KEY ("supplierAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimePeriod" ADD CONSTRAINT "TimePeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricDefinition" ADD CONSTRAINT "MetricDefinition_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricSeries" ADD CONSTRAINT "MetricSeries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricSeries" ADD CONSTRAINT "MetricSeries_metricDefinitionId_fkey" FOREIGN KEY ("metricDefinitionId") REFERENCES "MetricDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricPoint" ADD CONSTRAINT "MetricPoint_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricPoint" ADD CONSTRAINT "MetricPoint_metricSeriesId_fkey" FOREIGN KEY ("metricSeriesId") REFERENCES "MetricSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricPoint" ADD CONSTRAINT "MetricPoint_timePeriodId_fkey" FOREIGN KEY ("timePeriodId") REFERENCES "TimePeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastModel" ADD CONSTRAINT "ForecastModel_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastModel" ADD CONSTRAINT "ForecastModel_metricSeriesId_fkey" FOREIGN KEY ("metricSeriesId") REFERENCES "MetricSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanVersion" ADD CONSTRAINT "PlanVersion_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanVersion" ADD CONSTRAINT "PlanVersion_createdByPersonId_fkey" FOREIGN KEY ("createdByPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingWorkspace" ADD CONSTRAINT "MarketingWorkspace_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "MarketingWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "MarketingWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_contentAssetId_fkey" FOREIGN KEY ("contentAssetId") REFERENCES "ContentAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPage" ADD CONSTRAINT "LandingPage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPage" ADD CONSTRAINT "LandingPage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingContact" ADD CONSTRAINT "MarketingContact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingContact" ADD CONSTRAINT "MarketingContact_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingLead" ADD CONSTRAINT "MarketingLead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingLead" ADD CONSTRAINT "MarketingLead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "MarketingContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingLead" ADD CONSTRAINT "MarketingLead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunnelStageDefinition" ADD CONSTRAINT "FunnelStageDefinition_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunnelEvent" ADD CONSTRAINT "FunnelEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunnelEvent" ADD CONSTRAINT "FunnelEvent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "MarketingContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunnelEvent" ADD CONSTRAINT "FunnelEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "MarketingLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunnelEvent" ADD CONSTRAINT "FunnelEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunnelEvent" ADD CONSTRAINT "FunnelEvent_funnelStageId_fkey" FOREIGN KEY ("funnelStageId") REFERENCES "FunnelStageDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorPersonId_fkey" FOREIGN KEY ("authorPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_ownerPersonId_fkey" FOREIGN KEY ("ownerPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_ownerPersonId_fkey" FOREIGN KEY ("ownerPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_ownerPersonId_fkey" FOREIGN KEY ("ownerPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityLink" ADD CONSTRAINT "EntityLink_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryContext" ADD CONSTRAINT "QueryContext_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryContext" ADD CONSTRAINT "QueryContext_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandDefinition" ADD CONSTRAINT "CommandDefinition_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillDefinition" ADD CONSTRAINT "SkillDefinition_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
