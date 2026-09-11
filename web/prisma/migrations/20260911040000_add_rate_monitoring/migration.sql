-- CreateEnum
CREATE TYPE "BankType" AS ENUM ('STATE_OWNED', 'PRIVATE', 'FOREIGN', 'ISLAMIC');

-- CreateEnum
CREATE TYPE "RateInstrument" AS ENUM ('FDR', 'DPS', 'SANCHAYAPATRA');

-- CreateEnum
CREATE TYPE "RateSourceMethod" AS ENUM ('MANUAL', 'SCRAPED');

-- CreateTable
CREATE TABLE "Bank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "type" "BankType" NOT NULL,
    "websiteUrl" TEXT,
    "rateCardUrl" TEXT,
    "creditRating" TEXT,
    "ratingAgency" TEXT,
    "ratingDate" TIMESTAMP(3),
    "statementUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateSnapshot" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "instrument" "RateInstrument" NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "ratePct" DOUBLE PRECISION NOT NULL,
    "method" "RateSourceMethod" NOT NULL,
    "source" TEXT NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapeLog" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "ratesFound" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ScrapeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BBAggregateRate" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ratePct" DOUBLE PRECISION NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BBAggregateRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bank_shortCode_key" ON "Bank"("shortCode");

-- CreateIndex
CREATE INDEX "RateSnapshot_bankId_instrument_termMonths_scrapedAt_idx" ON "RateSnapshot"("bankId", "instrument", "termMonths", "scrapedAt");

-- CreateIndex
CREATE INDEX "ScrapeLog_bankId_attemptedAt_idx" ON "ScrapeLog"("bankId", "attemptedAt");

-- AddForeignKey
ALTER TABLE "RateSnapshot" ADD CONSTRAINT "RateSnapshot_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapeLog" ADD CONSTRAINT "ScrapeLog_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
