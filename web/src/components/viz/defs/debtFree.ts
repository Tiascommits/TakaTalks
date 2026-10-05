import { digits, fmtDuration, fmtMonthFromNow, fmtPct, fmtTakaShort, monthsToPayoff, progress } from "@/lib/viz/math";
import { statRow, text, type VizDef, type VizState } from "../engine";
import { num, str } from "./common";

const LINKS = 30;
const PER_ROW = 6;

function calc(s: VizState) {
  const total = num(s, "total");
  const balance = Math.min(num(s, "balance"), total || Infinity);
  const months = monthsToPayoff(balance, num(s, "rate"), num(s, "emi"));
  const interestLeft = months === null ? 0 : Math.max(0, months * num(s, "emi") - balance);
  return { total, balance, pct: progress(total - balance, total), months, interestLeft };
}

export const debtFree: VizDef = {
  slug: "debt_free",
  fields: [
    { key: "name", kind: "text", label: { en: "Loan name", bn: "ঋণের নাম" }, maxLength: 40 },
    { key: "total", kind: "money", label: { en: "Original loan", bn: "মূল ঋণ" } },
    { key: "balance", kind: "money", label: { en: "Still owed", bn: "এখনো বাকি" } },
    { key: "emi", kind: "money", label: { en: "Monthly EMI", bn: "মাসিক কিস্তি" } },
    { key: "rate", kind: "percent", label: { en: "Interest rate", bn: "সুদের হার" } },
  ],
  defaults: { name: "", total: 1_500_000, balance: 900_000, emi: 30_000, rate: 12 },
  header(s, lang) {
    const { months } = calc(s);
    const title = str(s, "name") || (lang === "en" ? "Breaking my loan chain" : "ঋণের শিকল ভাঙছি");
    let subtitle: string;
    if (months === 0) subtitle = lang === "en" ? "Debt-free! ⛓️‍💥" : "ঋণমুক্ত! ⛓️‍💥";
    else if (months === null) subtitle = lang === "en" ? "The EMI doesn't cover the interest yet" : "কিস্তি এখনো সুদও ঢাকছে না";
    else subtitle = lang === "en" ? `Debt-free by ${fmtMonthFromNow(months, "en")}` : `${fmtMonthFromNow(months, "bn")}-এ ঋণমুক্ত`;
    return { eyebrow: lang === "en" ? "Break the chain" : "শিকল ভাঙো", title, subtitle };
  },
  draw(p, s) {
    const { ctx, stage, theme, lang, t } = p;
    const c = calc(s);
    const broken = Math.round(c.pct * LINKS);
    const rows = LINKS / PER_ROW;
    const step = stage.w / PER_ROW;
    const rowH = Math.min(120, (stage.h - 300) / rows);
    const contentH = rows * rowH + 90 + 140;
    const y0 = stage.y + Math.max(0, (stage.h - contentH) / 2);
    const steel = theme.ink;

    for (let i = 0; i < LINKS; i++) {
      const row = Math.floor(i / PER_ROW);
      // Snake the chain back and forth so it reads as one long chain.
      const col = row % 2 === 0 ? i % PER_ROW : PER_ROW - 1 - (i % PER_ROW);
      const cx = stage.x + col * step + step / 2;
      const cy = y0 + row * rowH + rowH / 2;
      const isBroken = i < broken;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.lineCap = "round";
      if (i % 2 === 0) {
        // Flat link (an open oval).
        const rx = step * 0.42;
        const ry = rowH * 0.26;
        ctx.lineWidth = 13;
        ctx.strokeStyle = isBroken ? theme.accent2 : steel;
        ctx.globalAlpha = isBroken ? 0.55 : 0.9;
        if (isBroken) {
          ctx.rotate(-0.12);
          ctx.beginPath();
          ctx.ellipse(-8, -4, rx, ry, 0, Math.PI * 0.62, Math.PI * 1.85);
          ctx.stroke();
          ctx.rotate(0.24);
          ctx.beginPath();
          ctx.ellipse(8, 6, rx, ry, 0, Math.PI * 1.9, Math.PI * 0.55);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        // Edge-on link (a bar) joining its neighbours.
        ctx.fillStyle = isBroken ? theme.accent2 : steel;
        ctx.globalAlpha = isBroken ? 0.55 : 0.9;
        const w = step * 0.95;
        if (isBroken) {
          ctx.rotate(0.15);
          ctx.fillRect(-w / 2, -7, w * 0.42, 14);
          ctx.rotate(-0.3);
          ctx.fillRect(w * 0.08, -7, w * 0.42, 14);
        } else {
          ctx.fillRect(-w / 2, -7, w, 14);
        }
      }
      ctx.restore();
      if (isBroken && i % 2 === 0) {
        text(ctx, "✦", cx, cy - rowH * 0.32, { size: 20, color: theme.accent, align: "center" });
      }
    }

    let y = y0 + rows * rowH + 50;
    const line =
      c.months === null
        ? t("Raise the EMI — right now the chain grows back.", "কিস্তি বাড়ান — নইলে শিকল আবার লম্বা হবে।")
        : c.months === 0
          ? t("Every link broken. You're free!", "সব শিকল ভেঙেছে। আপনি মুক্ত!")
          : t(
              `${broken} of ${LINKS} links broken · ${fmtTakaShort(c.interestLeft, "en")} interest still to pay`,
              `${LINKS}টির ${broken}টি শিকল ভেঙেছে · আরও ${fmtTakaShort(c.interestLeft, "bn")} সুদ দিতে হবে`
            );
    text(ctx, digits(line, lang), stage.x + stage.w / 2, y, {
      size: 27,
      weight: 600,
      color: theme.ink,
      align: "center",
      maxW: stage.w,
    });
    y += 40;
    statRow(p, { x: stage.x, y, w: stage.w, h: 140 }, [
      { label: t("Paid off", "পরিশোধ"), value: fmtPct(c.pct, lang) },
      { label: t("Still owed", "বাকি"), value: fmtTakaShort(c.balance, lang) },
      {
        label: c.months ? t(`Free · ${fmtMonthFromNow(c.months, "en")}`, `মুক্তি · ${fmtMonthFromNow(c.months, "bn")}`) : t("Free in", "মুক্তি"),
        value: c.months === null ? "—" : c.months === 0 ? t("Now! 🎉", "এখনই! 🎉") : fmtDuration(c.months, lang),
        highlight: true,
      },
    ]);
  },
};
