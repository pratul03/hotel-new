/*
  Warnings:

  - You are about to drop the `_BookingHistoryToChargebackCase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BookingHistoryToSettlementQuote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BookingHistoryToTaxInvoice` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_BookingHistoryToChargebackCase" DROP CONSTRAINT "_BookingHistoryToChargebackCase_A_fkey";

-- DropForeignKey
ALTER TABLE "_BookingHistoryToChargebackCase" DROP CONSTRAINT "_BookingHistoryToChargebackCase_B_fkey";

-- DropForeignKey
ALTER TABLE "_BookingHistoryToSettlementQuote" DROP CONSTRAINT "_BookingHistoryToSettlementQuote_A_fkey";

-- DropForeignKey
ALTER TABLE "_BookingHistoryToSettlementQuote" DROP CONSTRAINT "_BookingHistoryToSettlementQuote_B_fkey";

-- DropForeignKey
ALTER TABLE "_BookingHistoryToTaxInvoice" DROP CONSTRAINT "_BookingHistoryToTaxInvoice_A_fkey";

-- DropForeignKey
ALTER TABLE "_BookingHistoryToTaxInvoice" DROP CONSTRAINT "_BookingHistoryToTaxInvoice_B_fkey";

-- DropTable
DROP TABLE "_BookingHistoryToChargebackCase";

-- DropTable
DROP TABLE "_BookingHistoryToSettlementQuote";

-- DropTable
DROP TABLE "_BookingHistoryToTaxInvoice";
