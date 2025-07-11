-- CreateIndex
CREATE INDEX "indicators_investigationId_idx" ON "indicators"("investigationId");

-- CreateIndex
CREATE INDEX "investigation_logs_investigationId_idx" ON "investigation_logs"("investigationId");

-- CreateIndex
CREATE INDEX "results_investigationId_idx" ON "results"("investigationId");

-- CreateIndex
CREATE INDEX "results_toolSource_idx" ON "results"("toolSource");
