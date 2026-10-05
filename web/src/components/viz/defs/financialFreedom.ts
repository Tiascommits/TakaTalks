import {
  digits,
  fmtTakaShort,
  freedomNumber,
  monthsToGoal,
  progress,
  realReturnPct,
} from "@/lib/viz/math";
import { fillRound, font, statRow, text, type Poster, type VizDef, type VizState } from "../engine";
import { num } from "./common";

function calc(s: VizState) {
  const target = freedomNumber(num(s, "expense"), num(s, "swr"));
  const worth = num(s, "networth");
  const pct = progress(worth, target);
  const months = monthsToGoal(target, worth, num(s, "monthly"), realReturnPct(num(s, "ret"), num(s, "infl")));
  // You're always on the board: square 1 at zero, 100 once free.
  const square = pct >= 1 ? 100 : Math.max(1, Math.min(99, Math.floor(pct * 100) + 1));
  return { target, pct, months, square };
}

/** Centre of square n (1–100) on a boustrophedon board, square 1 bottom-left. */
function cellCenter(n: number, x0: number, y0: number, cell: number) {
  const row = Math.floor((n - 1) / 10);
  const i = (n - 1) % 10;
  const col = row % 2 === 0 ? i : 9 - i;
  return { x: x0 + col * cell + cell / 2, y: y0 + (9 - row) * cell + cell / 2 };
}

function pill(p: Poster, label: string, x: number, y: number, bg: string, fg: string) {
  const { ctx } = p;
  ctx.font = font(600, 17);
  const w = ctx.measureText(label).width + 18;
  fillRound(ctx, { x: x - w / 2, y: y - 15, w, h: 28 }, 14, bg);
  text(ctx, label, x, y + 5, { size: 17, weight: 600, color: fg, align: "center" });
}

export const financialFreedom: VizDef = {
  slug: "financial_freedom",
  fields: [
    { key: "age", kind: "number", label: { en: "Your age", bn: "আপনার বয়স" } },
    { key: "expense", kind: "money", label: { en: "Monthly expenses (today)", bn: "মাসিক খরচ (আজকের হিসাবে)" } },
    { key: "networth", kind: "money", label: { en: "Invested / saved so far", bn: "এ পর্যন্ত বিনিয়োগ/সঞ্চয়" } },
    { key: "monthly", kind: "money", label: { en: "Investing per month", bn: "মাসে বিনিয়োগ" } },
    { key: "ret", kind: "percent", label: { en: "Expected return", bn: "প্রত্যাশিত মুনাফা" } },
    { key: "infl", kind: "percent", label: { en: "Inflation", bn: "মূল্যস্ফীতি" } },
    { key: "swr", kind: "percent", label: { en: "Safe yearly withdrawal", bn: "নিরাপদ বার্ষিক উত্তোলন" } },
  ],
  defaults: { age: 28, expense: 60_000, networth: 1_500_000, monthly: 35_000, ret: 11, infl: 8, swr: 4 },
  header(s, lang) {
    const { square } = calc(s);
    return {
      eyebrow: lang === "en" ? "Freedom Ludo · snakes & ladders" : "স্বাধীনতার সাপ-লুডু",
      title:
        square >= 100
          ? lang === "en"
            ? "I'm financially free! 🏝️"
            : "আমি আর্থিকভাবে স্বাধীন! 🏝️"
          : lang === "en"
            ? `I'm on square ${square} of 100`
            : `১০০ ঘরের মধ্যে আমি ${digits(String(square), "bn")} নম্বরে`,
      subtitle: lang === "en" ? "Every taka invested is a roll of the dice" : "প্রতিটি বিনিয়োগ মানে ছক্কার এক চাল",
    };
  },
  draw(p, s) {
    const { ctx, stage, theme, lang, t } = p;
    const { target, months, square } = calc(s);
    const statsH = 140;
    const size = Math.min(stage.w, stage.h - statsH - 36);
    const cell = size / 10;
    const x0 = stage.x + (stage.w - size) / 2;
    const y0 = stage.y + Math.max(0, (stage.h - size - statsH - 36) / 2);

    // Board
    for (let n = 1; n <= 100; n++) {
      const c = cellCenter(n, x0, y0, cell);
      const bx = c.x - cell / 2;
      const by = c.y - cell / 2;
      const odd = Math.round((c.x - x0 - cell / 2) / cell + (c.y - y0 - cell / 2) / cell) % 2;
      ctx.fillStyle = n === 100 ? theme.accent : odd ? theme.empty : theme.card;
      ctx.fillRect(bx, by, cell, cell);
      if (n < square) {
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = theme.accent2;
        ctx.fillRect(bx, by, cell, cell);
        ctx.restore();
      }
      if (n === 100) {
        text(ctx, "🏝️", c.x, c.y + 4, { size: cell * 0.42, family: "emoji", color: theme.onAccent, align: "center" });
        text(ctx, t("FREE", "মুক্ত"), c.x, c.y + cell * 0.4, {
          size: 15,
          weight: 700,
          family: "mono",
          color: theme.onAccent,
          align: "center",
        });
      } else {
        text(ctx, digits(String(n), lang), bx + 6, by + 20, { size: 16, weight: 500, family: "mono", color: theme.muted });
      }
    }
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 3;
    ctx.strokeRect(x0, y0, size, size);

    // Ladders (good habits) and snakes (setbacks): decorative, same on every board.
    const ladders: [number, number, string][] = [
      [3, 22, t("DPS", "ডিপিএস")],
      [28, 48, t("Raise", "প্রমোশন")],
      [45, 64, t("Side income", "বাড়তি আয়")],
      [71, 92, t("Compounding", "চক্রবৃদ্ধি")],
    ];
    const snakes: [number, number, string][] = [
      [36, 15, t("Lifestyle creep", "বিলাসী খরচ")],
      [58, 39, t("Medical shock", "হঠাৎ অসুখ")],
      [87, 66, t("Bad loan", "ভুল ঋণ")],
      [97, 78, t("Scam", "প্রতারণা")],
    ];
    for (const [a, b, label] of ladders) {
      const A = cellCenter(a, x0, y0, cell);
      const B = cellCenter(b, x0, y0, cell);
      const ang = Math.atan2(B.y - A.y, B.x - A.x);
      const nx = Math.sin(ang) * cell * 0.17;
      const ny = -Math.cos(ang) * cell * 0.17;
      ctx.strokeStyle = theme.accent2;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(A.x + nx, A.y + ny);
      ctx.lineTo(B.x + nx, B.y + ny);
      ctx.moveTo(A.x - nx, A.y - ny);
      ctx.lineTo(B.x - nx, B.y - ny);
      const len = Math.hypot(B.x - A.x, B.y - A.y);
      const rungs = Math.max(3, Math.floor(len / (cell * 0.45)));
      for (let r = 1; r < rungs; r++) {
        const f = r / rungs;
        const mx = A.x + (B.x - A.x) * f;
        const my = A.y + (B.y - A.y) * f;
        ctx.moveTo(mx + nx, my + ny);
        ctx.lineTo(mx - nx, my - ny);
      }
      ctx.stroke();
      pill(p, `↑ ${label}`, (A.x + B.x) / 2, (A.y + B.y) / 2, theme.accent2, "#fff");
    }
    for (const [a, b, label] of snakes) {
      const A = cellCenter(a, x0, y0, cell);
      const B = cellCenter(b, x0, y0, cell);
      const dx = B.x - A.x;
      const dy = B.y - A.y;
      const px = -dy * 0.25;
      const py = dx * 0.25;
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = cell * 0.16;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.bezierCurveTo(A.x + dx / 3 + px, A.y + dy / 3 + py, A.x + (2 * dx) / 3 - px, A.y + (2 * dy) / 3 - py, B.x, B.y);
      ctx.stroke();
      ctx.fillStyle = theme.accent;
      ctx.beginPath();
      ctx.arc(A.x, A.y, cell * 0.17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(A.x - cell * 0.06, A.y - cell * 0.04, cell * 0.045, 0, Math.PI * 2);
      ctx.arc(A.x + cell * 0.06, A.y - cell * 0.04, cell * 0.045, 0, Math.PI * 2);
      ctx.fill();
      pill(p, `↓ ${label}`, (A.x + B.x) / 2, (A.y + B.y) / 2, theme.accent, theme.onAccent);
    }

    // The player's token.
    const me = cellCenter(square, x0, y0, cell);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = theme.ink;
    ctx.beginPath();
    ctx.arc(me.x, me.y, cell * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = theme.accent2;
    ctx.beginPath();
    ctx.arc(me.x, me.y, cell * 0.32, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, t("ME", "আমি"), me.x, me.y + 7, { size: 20, weight: 700, family: "sans", color: "#fff", align: "center" });

    // Stats
    const age = num(s, "age");
    let eta: string;
    if (months === 0) eta = t("Free now 🎉", "এখনই মুক্ত 🎉");
    else if (months === null) eta = t("Invest more!", "আরও বিনিয়োগ!");
    else if (age > 0) eta = t(`Age ${Math.ceil(age + months / 12)}`, `${digits(String(Math.ceil(age + months / 12)), "bn")} বছর বয়সে`);
    else eta = t(`${Math.ceil(months / 12)} yrs`, `${digits(String(Math.ceil(months / 12)), "bn")} বছরে`);
    statRow(p, { x: stage.x, y: y0 + size + 36, w: stage.w, h: statsH }, [
      { label: t("Freedom number", "স্বাধীনতার অঙ্ক"), value: fmtTakaShort(target, lang) },
      { label: t("Square", "ঘর"), value: `${digits(String(square), lang)}/${digits("100", lang)}` },
      { label: t("Free at", "মুক্তি"), value: eta, highlight: true },
    ]);
  },
};
