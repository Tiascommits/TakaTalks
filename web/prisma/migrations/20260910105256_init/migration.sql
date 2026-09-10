-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "IncomeEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "frequency" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IncomeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvestmentEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "instrumentType" TEXT NOT NULL,
    "principalAmount" REAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "expectedRatePct" REAL NOT NULL,
    "maturityDate" DATETIME NOT NULL,
    "payoutConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "payoutAmount" REAL,
    "payoutConfirmedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvestmentEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaxProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "disabledChildren" INTEGER NOT NULL DEFAULT 0,
    "firstTimeFiler" BOOLEAN NOT NULL DEFAULT false,
    "netWealth" REAL NOT NULL DEFAULT 0,
    "multiCar" BOOLEAN NOT NULL DEFAULT false,
    "bigHouse" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaxProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "IncomeEntry_userId_idx" ON "IncomeEntry"("userId");

-- CreateIndex
CREATE INDEX "InvestmentEntry_userId_idx" ON "InvestmentEntry"("userId");

-- CreateIndex
CREATE INDEX "InvestmentEntry_maturityDate_idx" ON "InvestmentEntry"("maturityDate");

-- CreateIndex
CREATE UNIQUE INDEX "TaxProfile_userId_key" ON "TaxProfile"("userId");
