-- AlterTable
ALTER TABLE "indicators" ADD COLUMN     "generation" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "investigations" ADD COLUMN     "currentPhase" TEXT NOT NULL DEFAULT 'ENRICHMENT',
ADD COLUMN     "maxGeneration" INTEGER NOT NULL DEFAULT 3;
