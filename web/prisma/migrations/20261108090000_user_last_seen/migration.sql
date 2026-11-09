-- Anonymous-account retention (src/config/retention.ts): existing rows start their clock at deploy time.
ALTER TABLE "User" ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
