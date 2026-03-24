-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DropletType" ADD VALUE 'ANALYSIS_CARD';
ALTER TYPE "DropletType" ADD VALUE 'EDITABLE_TABLE';
ALTER TYPE "DropletType" ADD VALUE 'FORM';
ALTER TYPE "DropletType" ADD VALUE 'MIXED_OUTPUT';

-- AlterTable
ALTER TABLE "VerticalDroplet" ALTER COLUMN "generationStatus" SET DEFAULT 'draft';

-- CreateTable
CREATE TABLE "VerticalDropletVersion" (
    "id" TEXT NOT NULL,
    "verticalDropletId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "shadowSkillDefinitionJson" JSONB NOT NULL,
    "authorHintText" TEXT,
    "generationPromptVersion" TEXT,
    "generationWarningsJson" JSONB,
    "statusSnapshot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT,

    CONSTRAINT "VerticalDropletVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL,
    "verticalId" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "templateText" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DummyDataScenario" (
    "id" TEXT NOT NULL,
    "verticalId" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entity" TEXT NOT NULL,
    "scenarioJson" JSONB NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DummyDataScenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerticalDropletVersion_verticalDropletId_idx" ON "VerticalDropletVersion"("verticalDropletId");

-- CreateIndex
CREATE INDEX "VerticalDropletVersion_createdByUserId_idx" ON "VerticalDropletVersion"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "VerticalDropletVersion_verticalDropletId_version_key" ON "VerticalDropletVersion"("verticalDropletId", "version");

-- CreateIndex
CREATE INDEX "PromptTemplate_verticalId_idx" ON "PromptTemplate"("verticalId");

-- CreateIndex
CREATE INDEX "PromptTemplate_status_idx" ON "PromptTemplate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PromptTemplate_key_version_key" ON "PromptTemplate"("key", "version");

-- CreateIndex
CREATE UNIQUE INDEX "DummyDataScenario_key_key" ON "DummyDataScenario"("key");

-- CreateIndex
CREATE INDEX "DummyDataScenario_verticalId_idx" ON "DummyDataScenario"("verticalId");

-- CreateIndex
CREATE INDEX "DummyDataScenario_status_idx" ON "DummyDataScenario"("status");

-- CreateIndex
CREATE INDEX "DummyDataScenario_entity_idx" ON "DummyDataScenario"("entity");

-- CreateIndex
CREATE INDEX "VerticalDroplet_verticalId_generationStatus_idx" ON "VerticalDroplet"("verticalId", "generationStatus");

-- AddForeignKey
ALTER TABLE "VerticalDropletVersion" ADD CONSTRAINT "VerticalDropletVersion_verticalDropletId_fkey" FOREIGN KEY ("verticalDropletId") REFERENCES "VerticalDroplet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerticalDropletVersion" ADD CONSTRAINT "VerticalDropletVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptTemplate" ADD CONSTRAINT "PromptTemplate_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DummyDataScenario" ADD CONSTRAINT "DummyDataScenario_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE SET NULL ON UPDATE CASCADE;
