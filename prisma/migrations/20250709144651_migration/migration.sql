-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "IndicatorType" ADD VALUE 'LOCATION';
ALTER TYPE "IndicatorType" ADD VALUE 'COUNTRY';
ALTER TYPE "IndicatorType" ADD VALUE 'ORGANIZATION';

-- AlterTable
ALTER TABLE "indicators" ADD COLUMN     "processed" BOOLEAN NOT NULL DEFAULT false;
