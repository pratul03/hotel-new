-- CreateTable
CREATE TABLE "InvoiceDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "paymentId" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'issued',
    "title" VARCHAR(160) NOT NULL,
    "documentNumber" VARCHAR(120) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "amount" DOUBLE PRECISION NOT NULL,
    "lineItems" TEXT NOT NULL DEFAULT '[]',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceDocument_documentNumber_key" ON "InvoiceDocument"("documentNumber");

-- CreateIndex
CREATE INDEX "InvoiceDocument_userId_idx" ON "InvoiceDocument"("userId");

-- CreateIndex
CREATE INDEX "InvoiceDocument_bookingId_idx" ON "InvoiceDocument"("bookingId");

-- CreateIndex
CREATE INDEX "InvoiceDocument_paymentId_idx" ON "InvoiceDocument"("paymentId");

-- CreateIndex
CREATE INDEX "InvoiceDocument_type_idx" ON "InvoiceDocument"("type");

-- CreateIndex
CREATE INDEX "InvoiceDocument_status_idx" ON "InvoiceDocument"("status");

-- CreateIndex
CREATE INDEX "InvoiceDocument_issuedAt_idx" ON "InvoiceDocument"("issuedAt");

-- AddForeignKey
ALTER TABLE "InvoiceDocument" ADD CONSTRAINT "InvoiceDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceDocument" ADD CONSTRAINT "InvoiceDocument_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceDocument" ADD CONSTRAINT "InvoiceDocument_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
