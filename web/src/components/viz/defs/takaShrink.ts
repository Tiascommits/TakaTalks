import { digits, fmtNum, fmtTakaShort, purchasingPower } from "@/lib/viz/math";
import { fillRound, roundRect, text, type Box, type Poster, type VizDef, type VizState } from "../engine";
import { num } from "./common";

function calc(s: VizState) {
  const amount = num(s, "amount");
  const years = Math.min(60, Math.round(num(s, "years")));
  const infl = num(s, "infl");
  const grown = amount * Math.pow(1 + num(s, "ret") / 100, years);
  return {
    amount,
    years,
    mattress: purchasingPower(amount, infl, years),
    invested: purchasingPower(grown, infl, years),
    grown,
  };
}

/** A banknote-ish rectangle: border, guilloche arcs, a ৳ seal. */
function note(p: Poster, b: Box, color: string, faded: boolean) {
  const { ctx } = p;
  ctx.save();
  ctx.globalAlpha = faded ? 0.55 : 1;
  fillRound(ctx, b, 10, color);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  roundRect(ctx, b.x + 8, b.y + 8, b.w - 16, b.h - 16, 6);
  ctx.stroke();
  ctx.save();
  roundRect(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.clip();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  for (let r = 10; r < b.w; r += 9) {
    ctx.beginPath();
    ctx.arc(b.x + b.w * 0.3, b.y + b.h * 0.5, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  const sr = Math.min(b.h * 0.28, b.w * 0.16);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(b.x + b.w - sr - 18, b.y + b.h / 2, sr, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, "৳", b.x + b.w - sr - 18, b.y + b.h / 2 + sr * 0.38, {
    size: sr * 1.1,
    weight: 700,
    family: "serif",
    color,
    align: "center",
  });
  ctx.restore();
}

export const takaShrink: VizDef = {
  slug: "taka_shrink",
  fields: [
    { key: "amount", kind: "money", label: { en: "Amount", bn: "টাকার পরিমাণ" } },
    { key: "years", kind: "number", label: { en: "Years from now", bn: "কত বছর পর" } },
    { key: "infl", kind: "percent", label: { en: "Inflation per year", bn: "বার্ষিক মূল্যস্ফীতি" } },
    { key: "ret", kind: "percent", label: { en: "If invested at", bn: "বিনিয়োগ করলে মুনাফা" } },
  ],
  defaults: { amount: 100_000, years: 10, infl: 9, ret: 11 },
  header(s, lang) {
    const c = calc(s);
    const year = new Date().getFullYear() + c.years;
    return {
      eyebrow: lang === "en" ? "The shrinking taka" : "টাকা ছোট হয়ে যাচ্ছে",
      title:
        lang === "en"
          ? `My ${fmtTakaShort(c.amount, "en")} in ${year}`
          : `${digits(String(year), "bn")} সালে আমার ${fmtTakaShort(c.amount, "bn")}`,
      subtitle: lang === "en" ? "What it will really buy, in today's prices" : "আজকের দামে আসলে কতটুকু কেনা যাবে",
    };
  },
  draw(p, s) {
    const { ctx, stage, theme, lang, t } = p;
    const c = calc(s);
    const rowH = Math.min(250, (stage.h - 60) / 3);
    const y0 = stage.y + Math.max(0, (stage.h - rowH * 3 - 60) / 2);
    const maxW = stage.w * 0.5;
    const maxH = rowH - 40;
    const ref = Math.max(c.amount, c.invested, 1);
    const yrs = digits(String(c.years), lang);

    const rows = [
      {
        label: t("TODAY", "আজ"),
        value: c.amount,
        color: "#2f7d5b",
        faded: false,
        sub: t("Full buying power", "পূর্ণ ক্রয়ক্ষমতা"),
      },
      {
        label: t(`UNDER THE MATTRESS · ${c.years} YRS`, `তোশকের নিচে · ${yrs} বছর`),
        value: c.mattress,
        color: "#7d7d72",
        faded: true,
        sub: t(
          `Lost ${fmtTakaShort(c.amount - c.mattress, "en")} of value`,
          `${fmtTakaShort(c.amount - c.mattress, "bn")} মূল্য হারিয়েছে`
        ),
      },
      {
        label: t(`INVESTED AT ${num(s, "ret")}% · ${c.years} YRS`, `${digits(String(num(s, "ret")), "bn")}% এ বিনিয়োগ · ${yrs} বছর`),
        value: c.invested,
        color: c.invested >= c.amount ? "#b8860b" : "#a0522d",
        faded: false,
        sub: t(
          `Grows to ${fmtTakaShort(c.grown, "en")} on paper`,
          `কাগজে-কলমে ${fmtTakaShort(c.grown, "bn")} হবে`
        ),
      },
    ];

    rows.forEach((r, i) => {
      const y = y0 + i * rowH;
      // Note area is proportional to buying power.
      const k = Math.sqrt(Math.max(0, r.value) / ref);
      const w = Math.max(30, maxW * k);
      const h = Math.max(14, maxH * k);
      note(p, { x: stage.x + (maxW - w) / 2, y: y + (rowH - h) / 2, w, h }, r.color, r.faded);
      const tx = stage.x + maxW + 40;
      const tw = stage.w - maxW - 40;
      text(ctx, r.label, tx, y + rowH / 2 - 44, { size: 20, weight: 500, family: "mono", color: theme.accent, maxW: tw });
      text(ctx, fmtTakaShort(r.value, lang), tx, y + rowH / 2 + 18, {
        size: 56,
        weight: 700,
        family: "serif",
        color: theme.ink,
        maxW: tw,
      });
      text(ctx, r.sub, tx, y + rowH / 2 + 54, { size: 22, color: theme.muted, maxW: tw });
      if (i < 2) {
        ctx.strokeStyle = theme.empty;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(stage.x, y + rowH);
        ctx.lineTo(stage.x + stage.w, y + rowH);
        ctx.stroke();
      }
    });

    text(
      ctx,
      t(
        `Values in today's taka · assumes ${fmtNum(num(s, "infl"), "en", 1)}% inflation a year`,
        `আজকের টাকার মূল্যে · বছরে ${fmtNum(num(s, "infl"), "bn", 1)}% মূল্যস্ফীতি ধরে`
      ),
      stage.x + stage.w / 2,
      y0 + rowH * 3 + 44,
      { size: 20, family: "mono", color: theme.muted, align: "center", maxW: stage.w }
    );
  },
};
