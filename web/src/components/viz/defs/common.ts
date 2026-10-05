import { fmtDuration, fmtMonthFromNow, fmtTakaShort, monthsToGoal, progress, type Lang } from "@/lib/viz/math";
import { statRow, type Box, type Field, type Poster, type VizState } from "../engine";

export const num = (s: VizState, k: string) => {
  const v = Number(s[k]);
  return Number.isFinite(v) ? v : 0;
};
export const str = (s: VizState, k: string) => String(s[k] ?? "");

/** Fields shared by every "save up for X" visualizer. */
export function goalFields(nameLabel: { en: string; bn: string }): Field[] {
  return [
    { key: "name", kind: "text", label: nameLabel, maxLength: 40 },
    { key: "price", kind: "money", label: { en: "Target amount", bn: "লক্ষ্যের অঙ্ক" } },
    { key: "saved", kind: "money", label: { en: "Saved so far", bn: "এ পর্যন্ত জমেছে" } },
    { key: "monthly", kind: "money", label: { en: "Saving per month", bn: "মাসে জমাচ্ছি" } },
  ];
}

export type Goal = { pct: number; saved: number; price: number; left: number; months: number | null };

export function goal(s: VizState): Goal {
  const price = num(s, "price");
  const saved = num(s, "saved");
  return {
    price,
    saved,
    pct: progress(saved, price),
    left: Math.max(0, price - saved),
    months: monthsToGoal(price, saved, num(s, "monthly")),
  };
}

export function etaText(months: number | null, lang: Lang): string {
  if (months === null) return lang === "en" ? "Start saving!" : "জমানো শুরু করুন!";
  if (months === 0) return lang === "en" ? "Done! 🎉" : "সম্পূর্ণ! 🎉";
  return fmtDuration(months, lang);
}

export function goalStats(p: Poster, box: Box, g: Goal) {
  const { lang, t } = p;
  statRow(p, box, [
    { label: t("Saved", "জমেছে"), value: fmtTakaShort(g.saved, lang) },
    { label: t("To go", "বাকি"), value: fmtTakaShort(g.left, lang) },
    {
      label: g.months ? t(`ETA · ${fmtMonthFromNow(g.months, "en")}`, `সম্ভাব্য · ${fmtMonthFromNow(g.months, "bn")}`) : t("ETA", "সময়"),
      value: etaText(g.months, lang),
      highlight: true,
    },
  ]);
}

/** Pick the message for the highest threshold reached. */
export function tierLine(pct: number, tiers: [number, string][]): string {
  let out = tiers[0][1];
  for (const [at, msg] of tiers) if (pct >= at) out = msg;
  return out;
}
