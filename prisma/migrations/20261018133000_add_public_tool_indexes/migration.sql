-- Improve the public directory queries used for popular, newest, category and pricing filters.
CREATE INDEX "Tool_status_clicksCount_idx" ON "Tool"("status", "clicksCount");
CREATE INDEX "Tool_status_createdAt_idx" ON "Tool"("status", "createdAt");
CREATE INDEX "Tool_categoryId_status_clicksCount_idx" ON "Tool"("categoryId", "status", "clicksCount");
CREATE INDEX "Tool_pricing_status_idx" ON "Tool"("pricing", "status");
