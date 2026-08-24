-- CreateEnum
CREATE TYPE "StatutoryConfigType" AS ENUM ('EPF', 'ESIC', 'PROFESSIONAL_TAX', 'TDS', 'GRATUITY', 'OTHER_STATUTORY');
CREATE TYPE "StatutoryConfigStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUPERSEDED', 'CANCELLED');
CREATE TYPE "CompliancePeriodStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'PREPARED', 'FILED', 'RECONCILED', 'CLOSED');
CREATE TYPE "TaxRegime" AS ENUM ('OLD_REGIME', 'NEW_REGIME_115BAC');
CREATE TYPE "ComplianceExceptionSeverity" AS ENUM ('BLOCKING', 'WARNING', 'INFORMATION');
CREATE TYPE "ComplianceExceptionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED');

-- AlterTable PayrollRecord (Additive snapshot field)
ALTER TABLE "PayrollRecord" ADD COLUMN IF NOT EXISTS "statutoryConfigSnapshot" JSONB;

-- CreateTable StatutoryConfiguration
CREATE TABLE IF NOT EXISTS "StatutoryConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "configType" "StatutoryConfigType" NOT NULL,
    "jurisdictionState" TEXT,
    "financialYear" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "StatutoryConfigStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "rulesJson" JSONB NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StatutoryConfiguration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "StatutoryConfiguration_companyId_configType_status_idx" ON "StatutoryConfiguration"("companyId", "configType", "status");
CREATE INDEX IF NOT EXISTS "StatutoryConfiguration_companyId_financialYear_idx" ON "StatutoryConfiguration"("companyId", "financialYear");
CREATE INDEX IF NOT EXISTS "StatutoryConfiguration_companyId_effectiveFrom_effectiveTo_idx" ON "StatutoryConfiguration"("companyId", "effectiveFrom", "effectiveTo");

-- CreateTable CompliancePeriod
CREATE TABLE IF NOT EXISTS "CompliancePeriod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "quarter" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "CompliancePeriodStatus" NOT NULL DEFAULT 'OPEN',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompliancePeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CompliancePeriod_companyId_financialYear_month_key" ON "CompliancePeriod"("companyId", "financialYear", "month");
CREATE INDEX IF NOT EXISTS "CompliancePeriod_companyId_status_idx" ON "CompliancePeriod"("companyId", "status");

-- CreateTable EmployeeStatutoryProfile
CREATE TABLE IF NOT EXISTS "EmployeeStatutoryProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "taxRegime" "TaxRegime" NOT NULL DEFAULT 'NEW_REGIME_115BAC',
    "isEpfApplicable" BOOLEAN NOT NULL DEFAULT true,
    "isEsicApplicable" BOOLEAN NOT NULL DEFAULT true,
    "ptStateCode" TEXT,
    "panStatus" TEXT NOT NULL DEFAULT 'VALID',
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "source" TEXT NOT NULL DEFAULT 'SYSTEM_DEFAULT',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmployeeStatutoryProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmployeeStatutoryProfile_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeStatutoryProfile_employeeId_financialYear_effectiveFrom_key" ON "EmployeeStatutoryProfile"("employeeId", "financialYear", "effectiveFrom");
CREATE INDEX IF NOT EXISTS "EmployeeStatutoryProfile_companyId_financialYear_idx" ON "EmployeeStatutoryProfile"("companyId", "financialYear");

-- CreateTable ComplianceDocument
CREATE TABLE IF NOT EXISTS "ComplianceDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "statutoryPeriodId" TEXT,
    "payrollCycleId" TEXT,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePayloadPath" TEXT,
    "fileChecksumSha256" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "metadata" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComplianceDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComplianceDocument_statutoryPeriodId_fkey" FOREIGN KEY ("statutoryPeriodId") REFERENCES "CompliancePeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ComplianceDocument_payrollCycleId_fkey" FOREIGN KEY ("payrollCycleId") REFERENCES "PayrollCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ComplianceDocument_companyId_documentType_idx" ON "ComplianceDocument"("companyId", "documentType");
CREATE INDEX IF NOT EXISTS "ComplianceDocument_companyId_statutoryPeriodId_idx" ON "ComplianceDocument"("companyId", "statutoryPeriodId");

-- CreateTable ComplianceException
CREATE TABLE IF NOT EXISTS "ComplianceException" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT,
    "payrollCycleId" TEXT,
    "statutoryPeriodId" TEXT,
    "category" "StatutoryConfigType" NOT NULL DEFAULT 'OTHER_STATUTORY',
    "severity" "ComplianceExceptionSeverity" NOT NULL DEFAULT 'WARNING',
    "status" "ComplianceExceptionStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolutionNotes" TEXT,
    "detectedValue" TEXT,
    "expectedValue" TEXT,
    "createdById" TEXT NOT NULL,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComplianceException_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComplianceException_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ComplianceException_payrollCycleId_fkey" FOREIGN KEY ("payrollCycleId") REFERENCES "PayrollCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ComplianceException_statutoryPeriodId_fkey" FOREIGN KEY ("statutoryPeriodId") REFERENCES "CompliancePeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ComplianceException_companyId_status_severity_idx" ON "ComplianceException"("companyId", "status", "severity");
CREATE INDEX IF NOT EXISTS "ComplianceException_companyId_category_idx" ON "ComplianceException"("companyId", "category");
