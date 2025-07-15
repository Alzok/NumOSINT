-- CreateIndex
CREATE INDEX "indicators_processed_confidence_generation_idx" ON "indicators"("processed", "confidence", "generation");

-- CreateIndex
CREATE INDEX "investigations_status_idx" ON "investigations"("status");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");
