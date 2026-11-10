import { SITE_URL } from "@/config/site";
import { TAX_RULES } from "@/config/tax-rules-2025-26";

/**
 * The privacy-safe share: a fixed link and a fixed message, never a figure someone typed
 * (the calculator's "Copy link" carries income in the URL; this one never does).
 */
export const SHARE_URL = `${SITE_URL}/calculator?src=share`;

/** Day and month of the no-extra-tax filing date, from TAX_RULES. */
export const filingDayMonth = (locale: "en-GB" | "bn-BD") =>
  new Date(`${TAX_RULES.returnNoExtraTaxBy}T00:00:00Z`).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

export const shareText = (lang: "en" | "bn") =>
  lang === "bn"
    ? `আমি ${filingDayMonth("bn-BD")}ের আগে রিটার্ন দিচ্ছি · তোমার কর হিসাব করো ২ মিনিটে`
    : `I'm filing my tax return before ${filingDayMonth("en-GB")} · Work out your tax in 2 minutes`;
