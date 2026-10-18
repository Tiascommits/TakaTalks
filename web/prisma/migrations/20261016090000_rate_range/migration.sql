-- A source can give a rate as a range (Bangladesh Bank's chart: "8.50-8.90"); ratePct keeps the lower end.
ALTER TABLE "RateSnapshot" ADD COLUMN "ratePctMax" DOUBLE PRECISION;
