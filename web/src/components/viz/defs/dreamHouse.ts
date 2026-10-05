import { digits, fmtTaka } from "@/lib/viz/math";
import { fillRound, text, type Box, type VizDef } from "../engine";
import { goal, goalFields, goalStats, str, tierLine } from "./common";

const COLS = 12;
const WALL_ROWS = 10;
const ROOF_ROWS = 6;

/** Bricks in build order: wall bottom-up (running bond, skipping door/windows), then roof. */
function layout(x0: number, yBase: number, bw: number, bh: number) {
  const bricks: Box[] = [];
  const wallW = COLS * bw;
  const door: Box = { x: x0 + wallW / 2 - bw * 0.9, y: yBase - bh * 4.2, w: bw * 1.8, h: bh * 4.2 };
  const windows: Box[] = [
    { x: x0 + bw * 1.5, y: yBase - bh * 8, w: bw * 2.2, h: bh * 2.6 },
    { x: x0 + wallW - bw * 3.7, y: yBase - bh * 8, w: bw * 2.2, h: bh * 2.6 },
  ];
  const overlaps = (b: Box) =>
    [door, ...windows].some((o) => b.x < o.x + o.w - 2 && b.x + b.w > o.x + 2 && b.y < o.y + o.h - 2 && b.y + b.h > o.y + 2);

  for (let r = 0; r < WALL_ROWS; r++) {
    const y = yBase - (r + 1) * bh;
    const offset = r % 2 ? bw / 2 : 0;
    for (let x = x0 - offset; x < x0 + wallW - 1; x += bw) {
      const left = Math.max(x, x0);
      const right = Math.min(x + bw, x0 + wallW);
      const b = { x: left, y, w: right - left, h: bh };
      if (b.w > 4 && !overlaps(b)) bricks.push(b);
    }
  }
  // Roof: courses get shorter toward the ridge, overhanging the wall a little.
  const eaves = bw * 0.6;
  for (let r = 0; r < ROOF_ROWS; r++) {
    const y = yBase - WALL_ROWS * bh - (r + 1) * bh;
    const inset = (r * (wallW / 2 + eaves - bw * 0.8)) / ROOF_ROWS;
    const left = x0 - eaves + inset;
    const right = x0 + wallW + eaves - inset;
    const n = Math.max(1, Math.round((right - left) / bw));
    const w = (right - left) / n;
    for (let i = 0; i < n; i++) bricks.push({ x: left + i * w, y, w, h: bh });
  }
  return { bricks, door, windows };
}

export const dreamHouse: VizDef = {
  slug: "dream_house",
  fields: goalFields({ en: "Home / flat / plot", bn: "বাড়ি / ফ্ল্যাট / প্লট" }),
  defaults: { name: "", price: 8_000_000, saved: 1_800_000, monthly: 60_000 },
  header: (s, lang) => ({
    eyebrow: lang === "en" ? "Brick by brick" : "ইট ইট করে",
    title: str(s, "name") || (lang === "en" ? "My dream home" : "আমার স্বপ্নের বাড়ি"),
    subtitle: lang === "en" ? "Every brick is a piece of the down payment" : "প্রতিটি ইট মানে স্বপ্নের এক টুকরো",
  }),
  draw(p, s) {
    const { ctx, stage, theme, t } = p;
    const g = goal(s);
    const bw = (stage.w * 0.86) / COLS;
    const bh = bw * 0.44;
    const houseH = (WALL_ROWS + ROOF_ROWS) * bh;
    const contentH = houseH + 40 + 50 + 50 + 140;
    const y0 = stage.y + Math.max(0, (stage.h - contentH) / 2);
    const x0 = stage.x + (stage.w - COLS * bw) / 2;
    const yBase = y0 + houseH;

    const { bricks, door, windows } = layout(x0, yBase, bw, bh);
    const laid = Math.round(g.pct * bricks.length);
    bricks.forEach((b, i) => {
      const color = i < laid ? (i % 9 === 4 ? theme.accent2 : theme.accent) : theme.empty;
      fillRound(ctx, { x: b.x + 2, y: b.y + 2, w: b.w - 4, h: b.h - 4 }, 3, color);
    });
    // Door and windows: outlines always, glowing once the wall around them is up.
    const done = g.pct >= 1;
    for (const o of [door, ...windows]) {
      fillRound(ctx, o, 4, done ? theme.accent2 : theme.card);
      ctx.strokeStyle = theme.ink;
      ctx.lineWidth = 3;
      ctx.strokeRect(o.x, o.y, o.w, o.h);
    }
    for (const w of windows) {
      ctx.beginPath();
      ctx.moveTo(w.x + w.w / 2, w.y);
      ctx.lineTo(w.x + w.w / 2, w.y + w.h);
      ctx.moveTo(w.x, w.y + w.h / 2);
      ctx.lineTo(w.x + w.w, w.y + w.h / 2);
      ctx.stroke();
    }
    ctx.fillStyle = theme.ink;
    ctx.beginPath();
    ctx.arc(door.x + door.w * 0.78, door.y + door.h * 0.55, 5, 0, Math.PI * 2);
    ctx.fill();
    // Ground
    ctx.fillStyle = theme.ink;
    ctx.globalAlpha = 0.2;
    ctx.fillRect(stage.x, yBase + 4, stage.w, 6);
    ctx.globalAlpha = 1;
    if (done) text(ctx, "🎉", x0 + COLS * bw - 10, y0 + 40, { size: 64, family: "emoji", color: theme.ink, align: "right" });

    let y = yBase + 70;
    const per = g.price / bricks.length;
    text(
      ctx,
      t(
        `${laid} of ${bricks.length} bricks laid`,
        `${digits(String(bricks.length), "bn")}টি ইটের ${digits(String(laid), "bn")}টি বসানো হয়েছে`
      ),
      stage.x + stage.w / 2,
      y,
      { size: 40, weight: 700, family: "serif", color: theme.ink, align: "center", maxW: stage.w }
    );
    y += 46;
    text(
      ctx,
      t(`1 brick = ${fmtTaka(per, "en")}`, `১টি ইট = ${fmtTaka(per, "bn")}`) +
        "  ·  " +
        tierLine(g.pct, [
          [0, t("Foundation dug", "ভিত খোঁড়া হলো")],
          [0.2, t("Walls rising", "দেয়াল উঠছে")],
          [0.5, t("Halfway up!", "অর্ধেক উঠে গেছে!")],
          [0.62, t("Roof going on", "ছাদ ঢালাই চলছে")],
          [0.9, t("Painting the door", "দরজায় রং")],
          [1, t("Griho probesh! 🏡", "গৃহপ্রবেশ! 🏡")],
        ]),
      stage.x + stage.w / 2,
      y,
      { size: 26, color: theme.muted, align: "center", maxW: stage.w }
    );
    goalStats(p, { x: stage.x, y: y + 40, w: stage.w, h: 140 }, g);
  },
};
