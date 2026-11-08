"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { OPERATOR_NAME, PRIVACY_EMAIL } from "@/config/site";

export function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-line bg-card/60">
      <div className="max-w-[1160px] mx-auto px-5 py-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
        <span>{t("Estimates, not advice.", "আনুমানিক হিসাব, পরামর্শ নয়।")}</span>
        <Link href="/privacy" className="underline hover:text-green-deep">
          {t("Privacy notice", "গোপনীয়তা নীতি")}
        </Link>
        <Link href="/terms" className="underline hover:text-green-deep">
          {t("Terms of use", "ব্যবহারের শর্তাবলি")}
        </Link>
        {OPERATOR_NAME && <span>{t(`Run by ${OPERATOR_NAME}`, `পরিচালনায় ${OPERATOR_NAME}`)}</span>}
        {PRIVACY_EMAIL && (
          <a href={`mailto:${PRIVACY_EMAIL}`} className="underline hover:text-green-deep">
            {t("Privacy contact", "গোপনীয়তা বিষয়ে যোগাযোগ")}
          </a>
        )}
        <a
          href="https://github.com/Tiascommits/TakaTalks/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-green-deep"
        >
          {t("Feedback?", "মতামত?")}
        </a>
      </div>
    </footer>
  );
}
