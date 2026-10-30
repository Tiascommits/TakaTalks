-- Jev rate guard (todo/system-one-jev.md Task 2.2): why a stored scrape needs a human look; null = nothing flagged.
ALTER TABLE "ScrapeLog" ADD COLUMN "reviewNote" TEXT;
