-- CreateTable
CREATE TABLE "investigation_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inputData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "investigation_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "investigation_templates_userId_idx" ON "investigation_templates"("userId");

-- AddForeignKey
ALTER TABLE "investigation_templates" ADD CONSTRAINT "investigation_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
