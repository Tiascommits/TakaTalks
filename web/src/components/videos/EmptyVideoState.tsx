"use client";

import { useLanguage } from "@/lib/i18n";

export function EmptyVideoState({ label }: { label: { en: string; bn: string } }) {
  const { t } = useLanguage();

  return (
    <div className="border border-dashed border-line rounded-sm p-8 text-center text-sm text-muted">
      {t(label.en, label.bn)}
    </div>
  );
}
