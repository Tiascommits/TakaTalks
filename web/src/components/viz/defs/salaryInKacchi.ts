import { fmtNum, fmtTaka } from "@/lib/viz/math";
import { fillRound, text, type VizDef, type VizState } from "../engine";
import { num, str } from "./common";

/** Approximate Dhaka prices, October 2026 — for fun, not for budgeting. */
export const ITEMS = [
  { id: "kacchi", icon: "🍛", price: 450, en: "plates of kacchi", bn: "প্লেট কাচ্চি" },
  { id: "cha", icon: "☕", price: 15, en: "cups of cha", bn: "কাপ চা" },
  { id: "fuchka", icon: "🥟", price: 80, en: "plates of fuchka", bn: "প্লেট ফুচকা" },
  { id: "ilish", icon: "🐟", price: 2_200, en: "kg of ilish", bn: "কেজি ইলিশ" },
  { id: "cng", icon: "🛺", price: 300, en: "CNG rides", bn: "সিএনজি রাইড" },
  { id: "bus", icon: "🚌", price: 1_800, en: "bus trips to Cox's Bazar", bn: "কক্সবাজারের বাস টিকিট" },
  { id: "iphone", icon: "📱", price: 190_000, en: "latest iPhones", bn: "নতুন আইফোন" },
] as const;

const hero = (s: VizState) => ITEMS.find((i) => i.id === str(s, "hero")) ?? ITEMS[0];

function countText(n: number, lang: "en" | "bn") {
  return fmtNum(n, lang, n < 10 ? 1 : 0);
}

export const salaryInKacchi: VizDef = {
  slug: "salary_in_kacchi",
  fields: [
    { key: "salary", kind: "money", label: { en: "Monthly take-home salary", bn: "মাসিক হাতে পাওয়া বেতন" } },
    {
      key: "hero",
      kind: "select",
      label: { en: "Headline item", bn: "শিরোনামে কোনটা" },
      options: ITEMS.map((i) => ({ value: i.id, label: { en: `${i.icon} ${i.en}`, bn: `${i.icon} ${i.bn}` } })),
    },
  ],
  defaults: { salary: 60_000, hero: "kacchi" },
  header(s, lang) {
    const h = hero(s);
    const n = num(s, "salary") / h.price;
    return {
      eyebrow: lang === "en" ? "Salary converter" : "বেতন কনভার্টার",
      title:
        lang === "en"
          ? `My salary = ${countText(n, "en")} ${h.en} ${h.icon}`
          : `আমার বেতন = ${countText(n, "bn")} ${h.bn} ${h.icon}`,
      subtitle:
        lang === "en"
          ? `${fmtTaka(num(s, "salary"), "en")} a month, in real-life units`
          : `মাসে ${fmtTaka(num(s, "salary"), "bn")} — জীবনের মাপে`,
    };
  },
  draw(p, s) {
    const { ctx, stage, theme, lang, t } = p;
    const salary = num(s, "salary");
    const h = hero(s);
    const rowH = Math.min(118, (stage.h - 50) / ITEMS.length);
    const y0 = stage.y + Math.max(0, (stage.h - rowH * ITEMS.length - 50) / 2);
    const iconsX = stage.x + stage.w * 0.5;
    const iconsW = stage.w * 0.5 - 20;

    ITEMS.forEach((it, i) => {
      const y = y0 + i * rowH;
      const n = salary / it.price;
      const isHero = it.id === h.id;
      fillRound(ctx, { x: stage.x, y: y + 6, w: stage.w, h: rowH - 12 }, 16, isHero ? theme.accent : theme.card);
      const fg = isHero ? theme.onAccent : theme.ink;
      const mid = y + rowH / 2;
      text(ctx, it.icon, stage.x + 22, mid + 18, { size: 50, family: "emoji", color: fg });
      text(ctx, countText(n, lang), stage.x + 100, mid + 6, {
        size: 44,
        weight: 700,
        family: "serif",
        color: fg,
        maxW: iconsX - stage.x - 110,
      });
      text(ctx, t(it.en, it.bn), stage.x + 100, mid + 36, {
        size: 20,
        color: isHero ? theme.onAccent : theme.muted,
        maxW: iconsX - stage.x - 110,
      });

      // Icon strip: one icon per unit up to the cap; a fractional unit is drawn partially.
      const size = 34;
      const cap = Math.floor(iconsW / (size + 4));
      const whole = Math.min(cap, Math.floor(n));
      for (let k = 0; k < whole; k++) {
        text(ctx, it.icon, iconsX + k * (size + 4), mid + 12, { size: size - 4, family: "emoji", color: fg });
      }
      const frac = n - Math.floor(n);
      if (whole < cap && frac > 0.02) {
        const x = iconsX + whole * (size + 4);
        text(ctx, it.icon, x, mid + 12, { size: size - 4, family: "emoji", color: fg, alpha: 0.22 });
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, mid - size, size * frac, size * 2);
        ctx.clip();
        text(ctx, it.icon, x, mid + 12, { size: size - 4, family: "emoji", color: fg });
        ctx.restore();
      }
      if (n > cap) {
        text(ctx, "…", iconsX + iconsW + 8, mid + 10, { size: 30, weight: 700, color: fg, align: "right" });
      }
    });

    text(
      ctx,
      t("Approx. Dhaka prices, Oct 2026 · just for fun", "আনুমানিক ঢাকার দাম, অক্টোবর ২০২৬ · শুধু মজার জন্য"),
      stage.x + stage.w / 2,
      y0 + rowH * ITEMS.length + 36,
      { size: 20, family: "mono", color: theme.muted, align: "center", maxW: stage.w }
    );
  },
};
