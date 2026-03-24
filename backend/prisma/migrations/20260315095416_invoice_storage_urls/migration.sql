-- AlterTable
ALTER TABLE "InvoiceDocument" ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "storageBucket" VARCHAR(120),
ADD COLUMN     "storageKey" VARCHAR(500);

-- CreateIndex
CREATE INDEX "InvoiceDocument_storageBucket_idx" ON "InvoiceDocument"("storageBucket");
