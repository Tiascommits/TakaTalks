-- CreateEnum
CREATE TYPE "ReinvestCategory" AS ENUM ('SANCHAYAPATRA', 'GOVT_BOND', 'BANK_DEPOSIT', 'MUTUAL_FUND');

-- CreateTable
CREATE TABLE "ReinvestSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "investmentEntryId" TEXT,
    "reinvestAmount" DOUBLE PRECISION NOT NULL,
    "horizonYears" DOUBLE PRECISION NOT NULL,
    "hasPSR" BOOLEAN NOT NULL,
    "inflationPct" DOUBLE PRECISION NOT NULL,
    "topCategory" "ReinvestCategory" NOT NULL,
    "categoryScores" JSONB NOT NULL,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "seenAt" TIMESTAMP(3),
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReinvestSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReinvestSuggestion_userId_createdAt_idx" ON "ReinvestSuggestion"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ReinvestSuggestion_investmentEntryId_idx" ON "ReinvestSuggestion"("investmentEntryId");

-- AddForeignKey
ALTER TABLE "ReinvestSuggestion" ADD CONSTRAINT "ReinvestSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReinvestSuggestion" ADD CONSTRAINT "ReinvestSuggestion_investmentEntryId_fkey" FOREIGN KEY ("investmentEntryId") REFERENCES "InvestmentEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
