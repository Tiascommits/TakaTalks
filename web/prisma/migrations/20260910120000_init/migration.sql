-- CreateEnum
CREATE TYPE "IncomeFrequency" AS ENUM ('MONTHLY', 'ANNUAL', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "InstrumentType" AS ENUM ('SANCHAYPATRA', 'GOVT_BOND', 'MUTUAL_FUND', 'DSE_STOCK', 'LIFE_INSURANCE', 'PROVIDENT_FUND', 'DPS', 'DONATION', 'FIXED_DEPOSIT', 'OTHER');

-- CreateEnum
CREATE TYPE "TaxpayerCategory" AS ENUM ('GENERAL', 'WOMAN_SENIOR', 'THIRD_GENDER', 'DISABLED', 'FREEDOM_FIGHTER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "frequency" "IncomeFrequency" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "instrumentType" "InstrumentType" NOT NULL,
    "principalAmount" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "expectedRatePct" DOUBLE PRECISION NOT NULL,
    "maturityDate" TIMESTAMP(3) NOT NULL,
    "payoutConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "payoutAmount" DOUBLE PRECISION,
    "payoutConfirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "TaxpayerCategory" NOT NULL DEFAULT 'GENERAL',
    "disabledChildren" INTEGER NOT NULL DEFAULT 0,
    "firstTimeFiler" BOOLEAN NOT NULL DEFAULT false,
    "netWealth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "multiCar" BOOLEAN NOT NULL DEFAULT false,
    "bigHouse" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IncomeEntry_userId_idx" ON "IncomeEntry"("userId");

-- CreateIndex
CREATE INDEX "InvestmentEntry_userId_idx" ON "InvestmentEntry"("userId");

-- CreateIndex
CREATE INDEX "InvestmentEntry_maturityDate_idx" ON "InvestmentEntry"("maturityDate");

-- CreateIndex
CREATE UNIQUE INDEX "TaxProfile_userId_key" ON "TaxProfile"("userId");

-- AddForeignKey
ALTER TABLE "IncomeEntry" ADD CONSTRAINT "IncomeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentEntry" ADD CONSTRAINT "InvestmentEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxProfile" ADD CONSTRAINT "TaxProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
