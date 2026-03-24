/*
  Warnings:

  - A unique constraint covering the columns `[userId,roomId,listName]` on the table `Wishlist` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Wishlist_userId_roomId_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notificationPreferences" TEXT NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "Wishlist" ADD COLUMN     "listName" VARCHAR(120) NOT NULL DEFAULT 'Favorites';

-- CreateTable
CREATE TABLE "ChargebackCase" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceUrls" TEXT NOT NULL DEFAULT '[]',
    "status" VARCHAR(50) NOT NULL DEFAULT 'submitted',
    "timeline" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChargebackCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxInvoice" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceNumber" VARCHAR(120) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "lineItems" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "regime" VARCHAR(50) NOT NULL,
    "placeOfSupply" VARCHAR(120) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FxRate" (
    "id" TEXT NOT NULL,
    "baseCurrency" VARCHAR(10) NOT NULL,
    "quoteCurrency" VARCHAR(10) NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "provider" VARCHAR(100) NOT NULL DEFAULT 'manual',
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FxRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementQuote" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceCurrency" VARCHAR(10) NOT NULL,
    "targetCurrency" VARCHAR(10) NOT NULL,
    "exchangeRate" DOUBLE PRECISION NOT NULL,
    "sourceAmount" DOUBLE PRECISION NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "fxFee" DOUBLE PRECISION NOT NULL,
    "settlementAmount" DOUBLE PRECISION NOT NULL,
    "estimatedArrival" VARCHAR(60) NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'quoted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SettlementQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OffPlatformFeeCase" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceUrls" TEXT NOT NULL DEFAULT '[]',
    "status" VARCHAR(50) NOT NULL DEFAULT 'open',
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OffPlatformFeeCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelDisruptionCase" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" VARCHAR(80) NOT NULL,
    "severity" VARCHAR(30) NOT NULL,
    "refundPercent" DOUBLE PRECISION NOT NULL,
    "estimatedRefundAmount" DOUBLE PRECISION NOT NULL,
    "travelCreditPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recommendation" VARCHAR(80) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'assessed',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelDisruptionCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "hostUserId" TEXT NOT NULL,
    "hotelId" TEXT,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "city" VARCHAR(120) NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceListing" (
    "id" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "hotelId" TEXT,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "city" VARCHAR(120) NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankingExperiment" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "weights" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RankingExperiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BookingHistoryToChargebackCase" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BookingHistoryToChargebackCase_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BookingHistoryToTaxInvoice" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BookingHistoryToTaxInvoice_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BookingHistoryToSettlementQuote" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BookingHistoryToSettlementQuote_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "ChargebackCase_paymentId_idx" ON "ChargebackCase"("paymentId");

-- CreateIndex
CREATE INDEX "ChargebackCase_userId_idx" ON "ChargebackCase"("userId");

-- CreateIndex
CREATE INDEX "ChargebackCase_status_idx" ON "ChargebackCase"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TaxInvoice_invoiceNumber_key" ON "TaxInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "TaxInvoice_bookingId_idx" ON "TaxInvoice"("bookingId");

-- CreateIndex
CREATE INDEX "TaxInvoice_paymentId_idx" ON "TaxInvoice"("paymentId");

-- CreateIndex
CREATE INDEX "TaxInvoice_issuedAt_idx" ON "TaxInvoice"("issuedAt");

-- CreateIndex
CREATE INDEX "FxRate_baseCurrency_quoteCurrency_idx" ON "FxRate"("baseCurrency", "quoteCurrency");

-- CreateIndex
CREATE UNIQUE INDEX "FxRate_baseCurrency_quoteCurrency_key" ON "FxRate"("baseCurrency", "quoteCurrency");

-- CreateIndex
CREATE INDEX "SettlementQuote_bookingId_idx" ON "SettlementQuote"("bookingId");

-- CreateIndex
CREATE INDEX "SettlementQuote_paymentId_idx" ON "SettlementQuote"("paymentId");

-- CreateIndex
CREATE INDEX "SettlementQuote_userId_idx" ON "SettlementQuote"("userId");

-- CreateIndex
CREATE INDEX "SettlementQuote_targetCurrency_idx" ON "SettlementQuote"("targetCurrency");

-- CreateIndex
CREATE INDEX "OffPlatformFeeCase_bookingId_idx" ON "OffPlatformFeeCase"("bookingId");

-- CreateIndex
CREATE INDEX "OffPlatformFeeCase_reporterUserId_idx" ON "OffPlatformFeeCase"("reporterUserId");

-- CreateIndex
CREATE INDEX "OffPlatformFeeCase_status_idx" ON "OffPlatformFeeCase"("status");

-- CreateIndex
CREATE INDEX "TravelDisruptionCase_bookingId_idx" ON "TravelDisruptionCase"("bookingId");

-- CreateIndex
CREATE INDEX "TravelDisruptionCase_userId_idx" ON "TravelDisruptionCase"("userId");

-- CreateIndex
CREATE INDEX "TravelDisruptionCase_status_idx" ON "TravelDisruptionCase"("status");

-- CreateIndex
CREATE INDEX "Experience_hostUserId_idx" ON "Experience"("hostUserId");

-- CreateIndex
CREATE INDEX "Experience_hotelId_idx" ON "Experience"("hotelId");

-- CreateIndex
CREATE INDEX "Experience_city_category_idx" ON "Experience"("city", "category");

-- CreateIndex
CREATE INDEX "Experience_status_idx" ON "Experience"("status");

-- CreateIndex
CREATE INDEX "ServiceListing_providerUserId_idx" ON "ServiceListing"("providerUserId");

-- CreateIndex
CREATE INDEX "ServiceListing_hotelId_idx" ON "ServiceListing"("hotelId");

-- CreateIndex
CREATE INDEX "ServiceListing_city_category_idx" ON "ServiceListing"("city", "category");

-- CreateIndex
CREATE INDEX "ServiceListing_status_idx" ON "ServiceListing"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RankingExperiment_name_key" ON "RankingExperiment"("name");

-- CreateIndex
CREATE INDEX "RankingExperiment_enabled_idx" ON "RankingExperiment"("enabled");

-- CreateIndex
CREATE INDEX "RankingExperiment_createdByUserId_idx" ON "RankingExperiment"("createdByUserId");

-- CreateIndex
CREATE INDEX "_BookingHistoryToChargebackCase_B_index" ON "_BookingHistoryToChargebackCase"("B");

-- CreateIndex
CREATE INDEX "_BookingHistoryToTaxInvoice_B_index" ON "_BookingHistoryToTaxInvoice"("B");

-- CreateIndex
CREATE INDEX "_BookingHistoryToSettlementQuote_B_index" ON "_BookingHistoryToSettlementQuote"("B");

-- CreateIndex
CREATE INDEX "Wishlist_userId_listName_idx" ON "Wishlist"("userId", "listName");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_userId_roomId_listName_key" ON "Wishlist"("userId", "roomId", "listName");

-- AddForeignKey
ALTER TABLE "ChargebackCase" ADD CONSTRAINT "ChargebackCase_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargebackCase" ADD CONSTRAINT "ChargebackCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxInvoice" ADD CONSTRAINT "TaxInvoice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxInvoice" ADD CONSTRAINT "TaxInvoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementQuote" ADD CONSTRAINT "SettlementQuote_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementQuote" ADD CONSTRAINT "SettlementQuote_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementQuote" ADD CONSTRAINT "SettlementQuote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffPlatformFeeCase" ADD CONSTRAINT "OffPlatformFeeCase_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffPlatformFeeCase" ADD CONSTRAINT "OffPlatformFeeCase_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelDisruptionCase" ADD CONSTRAINT "TravelDisruptionCase_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelDisruptionCase" ADD CONSTRAINT "TravelDisruptionCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceListing" ADD CONSTRAINT "ServiceListing_providerUserId_fkey" FOREIGN KEY ("providerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceListing" ADD CONSTRAINT "ServiceListing_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingExperiment" ADD CONSTRAINT "RankingExperiment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookingHistoryToChargebackCase" ADD CONSTRAINT "_BookingHistoryToChargebackCase_A_fkey" FOREIGN KEY ("A") REFERENCES "BookingHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookingHistoryToChargebackCase" ADD CONSTRAINT "_BookingHistoryToChargebackCase_B_fkey" FOREIGN KEY ("B") REFERENCES "ChargebackCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookingHistoryToTaxInvoice" ADD CONSTRAINT "_BookingHistoryToTaxInvoice_A_fkey" FOREIGN KEY ("A") REFERENCES "BookingHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookingHistoryToTaxInvoice" ADD CONSTRAINT "_BookingHistoryToTaxInvoice_B_fkey" FOREIGN KEY ("B") REFERENCES "TaxInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookingHistoryToSettlementQuote" ADD CONSTRAINT "_BookingHistoryToSettlementQuote_A_fkey" FOREIGN KEY ("A") REFERENCES "BookingHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookingHistoryToSettlementQuote" ADD CONSTRAINT "_BookingHistoryToSettlementQuote_B_fkey" FOREIGN KEY ("B") REFERENCES "SettlementQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
