import { boxChallengeTotal, decodeBits, digits, encodeBits, fmtPct, fmtTakaShort } from "@/lib/viz/math";
import { fillRound, statRow, text, type Hit, type VizDef, type VizState } from "../engine";
import { num, str } from "./common";

const BOXES = 100;

const multiplier = (s: VizState) => Math.max(1, num(s, "mult") || 100);

export const hundredBox: VizDef = {
  slug: "hundred_box",
  fields: [
    {
      key: "mult",
      kind: "select",
      label: { en: "Box N is worth N ×", bn: "N নম্বর ঘরের মূল্য N ×" },
      options: [10, 20, 50, 100, 200, 500].map((m) => ({
        value: String(m),
        label: {
          en: `৳${m}  (total ${fmtTakaShort(boxChallengeTotal(BOXES, m), "en")})`,
          bn: `৳${m}  (মোট ${fmtTakaShort(boxChallengeTotal(BOXES, m), "bn")})`,
        },
      })),
    },
  ],
  defaults: { mult: "100", done: "" },
  reset: { label: { en: "Clear all ticks", bn: "সব টিক মুছুন" }, state: { done: "" } },
  header(s, lang) {
    const total = boxChallengeTotal(BOXES, multiplier(s));
    return {
      eyebrow: lang === "en" ? "100-box savings challenge" : "১০০ ঘর সঞ্চয় চ্যালেঞ্জ",
      title: lang === "en" ? `The ${fmtTakaShort(total, "en")} Challenge` : `${fmtTakaShort(total, "bn")} চ্যালেঞ্জ`,
      subtitle:
        lang === "en"
          ? "Save a box's amount, tick it off. Any order."
          : "যে ঘরের টাকা জমাবেন, সেটি টিক দিন। যেকোনো ক্রমে।",
    };
  },
  onHit(s, id) {
    const ticked = decodeBits(str(s, "done"), BOXES);
    const i = Number(id);
    if (ticked.has(i)) ticked.delete(i);
    else ticked.add(i);
    return { ...s, done: encodeBits(ticked, BOXES) };
  },
  draw(p, s) {
    const { ctx, stage, theme, lang, t } = p;
    const mult = multiplier(s);
    const ticked = decodeBits(str(s, "done"), BOXES);
    const statsH = 140;
    const size = Math.min(stage.w, stage.h - statsH - 30);
    const cell = size / 10;
    const x0 = stage.x + (stage.w - size) / 2;
    const y0 = stage.y + Math.max(0, (stage.h - size - statsH - 30) / 2);
    const hits: Hit[] = [];
    let saved = 0;

    for (let i = 0; i < BOXES; i++) {
      const x = x0 + (i % 10) * cell;
      const y = y0 + Math.floor(i / 10) * cell;
      const on = ticked.has(i);
      const amount = (i + 1) * mult;
      if (on) saved += amount;
      const box = { x: x + 3, y: y + 3, w: cell - 6, h: cell - 6 };
      fillRound(ctx, box, 8, on ? theme.accent : theme.card);
      if (!on) {
        ctx.strokeStyle = theme.empty;
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2);
      }
      text(ctx, fmtTakaShort(amount, lang).replace(" lakh", "L").replace(" লাখ", "লা"), x + cell / 2, y + cell / 2 + 7, {
        size: 19,
        weight: 600,
        family: "sans",
        color: on ? theme.onAccent : theme.ink,
        align: "center",
        maxW: cell - 12,
        alpha: on ? 0.55 : 1,
      });
      if (on) {
        ctx.strokeStyle = theme.accent2;
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(x + cell * 0.25, y + cell * 0.52);
        ctx.lineTo(x + cell * 0.43, y + cell * 0.7);
        ctx.lineTo(x + cell * 0.76, y + cell * 0.3);
        ctx.stroke();
      }
      // The whole cell is the tap target — gutters included — so fat fingers still land.
      hits.push({ x, y, w: cell, h: cell, id: String(i) });
    }

    const total = boxChallengeTotal(BOXES, mult);
    statRow(p, { x: stage.x, y: y0 + size + 30, w: stage.w, h: statsH }, [
      { label: t("Boxes ticked", "টিক দেওয়া ঘর"), value: digits(`${ticked.size}/${BOXES}`, lang) },
      { label: t("Saved", "জমেছে"), value: fmtTakaShort(saved, lang) },
      { label: t("Progress", "অগ্রগতি"), value: fmtPct(saved / total, lang), highlight: true },
    ]);
    return hits;
  },
};
