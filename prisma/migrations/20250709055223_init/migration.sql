-- CreateEnum
CREATE TYPE "InvestigationStatus" AS ENUM ('INITIALIZING', 'ENRICHING', 'SCANNING', 'CONSOLIDATING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "IndicatorType" AS ENUM ('NAME', 'EMAIL', 'USERNAME', 'PHONE', 'IP', 'DOMAIN', 'URL');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARNING', 'ERROR', 'DEBUG');

-- CreateTable
CREATE TABLE "investigations" (
    "id" TEXT NOT NULL,
    "status" "InvestigationStatus" NOT NULL DEFAULT 'INITIALIZING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "inputData" JSONB,
    "finalReport" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicators" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "type" "IndicatorType" NOT NULL,
    "value" TEXT NOT NULL,
    "source" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "results" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "indicatorId" TEXT,
    "toolSource" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigation_logs" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investigation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "indicators_investigationId_type_value_key" ON "indicators"("investigationId", "type", "value");

-- AddForeignKey
ALTER TABLE "indicators" ADD CONSTRAINT "indicators_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "indicators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigation_logs" ADD CONSTRAINT "investigation_logs_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
