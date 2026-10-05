import { fmtPct } from "@/lib/viz/math";
import { fillRound, rng, text, type VizDef, type VizState } from "../engine";
import { goal, goalFields, goalStats, str, tierLine } from "./common";

const PRESETS: Record<string, { icon: string; en: string; bn: string }> = {
  umrah: { icon: "🕋", en: "Umrah fund", bn: "উমরাহ তহবিল" },
  wedding: { icon: "💍", en: "Wedding fund", bn: "বিয়ের খরচ" },
  trip: { icon: "🏖️", en: "Cox's Bazar trip", bn: "কক্সবাজার ভ্রমণ" },
  laptop: { icon: "💻", en: "New laptop", bn: "নতুন ল্যাপটপ" },
  phone: { icon: "📱", en: "New phone", bn: "নতুন ফোন" },
  eid: { icon: "🎁", en: "Eid shopping", bn: "ঈদের কেনাকাটা" },
  custom: { icon: "⭐", en: "My goal", bn: "আমার লক্ষ্য" },
};

const preset = (s: VizState) => PRESETS[str(s, "preset")] ?? PRESETS.custom;

const CLAY = "#c56a3d";
const CLAY_DARK = "#8c4224";
const COIN = "#e2b23a";
const COIN_DARK = "#a77a12";

function coin(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tilt = 0.45) {
  ctx.fillStyle = COIN_DARK;
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.18, r, r * tilt, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COIN;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * tilt, 0, 0, Math.PI * 2);
  ctx.fill();
}

export const matirBank: VizDef = {
  slug: "matir_bank",
  fields: [
    {
      key: "preset",
      kind: "select",
      label: { en: "Saving for", bn: "যার জন্য জমাচ্ছি" },
      options: Object.entries(PRESETS).map(([value, p]) => ({
        value,
        label: { en: `${p.icon} ${p.en}`, bn: `${p.icon} ${p.bn}` },
      })),
    },
    ...goalFields({ en: "Name it (optional)", bn: "নাম দিন (ঐচ্ছিক)" }),
  ],
  defaults: { preset: "umrah", name: "", price: 250_000, saved: 95_000, monthly: 10_000 },
  header(s, lang) {
    const p = preset(s);
    return {
      eyebrow: lang === "en" ? "My matir bank" : "আমার মাটির ব্যাংক",
      title: `${p.icon} ${str(s, "name") || (lang === "en" ? p.en : p.bn)}`,
      subtitle: lang === "en" ? "Drop by drop, the pot fills" : "বিন্দু বিন্দু জলে সিন্ধু",
    };
  },
  draw(p, s) {
    const { ctx, stage, theme, lang, t } = p;
    const g = goal(s);
    const R = Math.min(stage.w * 0.3, (stage.h - 360) / 2.5);
    const contentH = R * 2.45 + 110 + 160;
    const y0 = stage.y + Math.max(0, (stage.h - contentH) / 2);
    const cx = stage.x + stage.w / 2;
    const cy = y0 + R * 0.45 + R;

    // Falling coins above the pot.
    if (g.pct < 1) {
      coin(ctx, cx - R * 0.05, y0 + 4, R * 0.1, 0.9);
      coin(ctx, cx + R * 0.16, y0 + R * 0.2, R * 0.08, 0.6);
    }
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + R * 0.98, R * 0.75, R * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Knob on top
    ctx.fillStyle = CLAY_DARK;
    ctx.beginPath();
    ctx.ellipse(cx, cy - R * 0.98, R * 0.22, R * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body
    ctx.fillStyle = CLAY;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // Cutaway: coins visible inside, up to the saved level.
    if (g.pct > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.86, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "rgba(60,25,10,0.55)";
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      const level = cy + R * 0.86 - g.pct * R * 1.72;
      const r = rng(11);
      const cr = R * 0.11;
      for (let y = cy + R; y > level; y -= cr * 0.42) {
        for (let x = cx - R + ((y * 7) % cr); x < cx + R; x += cr * 1.6) {
          coin(ctx, x + (r() - 0.5) * cr * 0.6, y, cr);
        }
      }
      ctx.restore();
      // Cutaway rim
      ctx.strokeStyle = CLAY_DARK;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.86, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Folk-art band and slot
    ctx.strokeStyle = "#fff4e0";
    ctx.lineWidth = 5;
    ctx.setLineDash([2, 14]);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.93, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (1.2 + i * 0.15);
      const px = cx + Math.cos(a) * R * 0.93;
      const py = cy + Math.sin(a) * R * 0.93;
      ctx.fillStyle = i % 2 ? "#f7d046" : "#fff4e0";
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    fillRound(ctx, { x: cx - R * 0.22, y: cy - R * 0.97, w: R * 0.44, h: R * 0.06 }, 6, "#3a1a0c");

    // Big percentage on the belly.
    text(ctx, fmtPct(g.pct, lang), cx, cy + R * 0.2, {
      size: R * 0.5,
      weight: 700,
      family: "serif",
      color: "#fff",
      align: "center",
      maxW: R * 1.6,
    });
    text(ctx, t("FULL", "ভরেছে"), cx, cy + R * 0.42, {
      size: 26,
      weight: 600,
      family: "mono",
      color: "#fff",
      align: "center",
      alpha: 0.85,
    });

    let y = cy + R + 80;
    text(
      ctx,
      tierLine(g.pct, [
        [0, t("First coin in — the hardest one!", "প্রথম কয়েন — সবচেয়ে কঠিনটা!")],
        [0.25, t("A quarter full. Keep shaking it 🪙", "চার ভাগের এক ভাগ ভরেছে 🪙")],
        [0.5, t("Halfway — it's getting heavy", "অর্ধেক — ভারী হচ্ছে")],
        [0.75, t("Almost time to break it!", "ভাঙার সময় প্রায় এসে গেছে!")],
        [1, t("Break the matir bank! 🔨🎉", "মাটির ব্যাংক ভাঙার সময়! 🔨🎉")],
      ]),
      cx,
      y,
      { size: 32, weight: 600, family: "serif", color: theme.ink, align: "center", maxW: stage.w }
    );
    y += 36;
    goalStats(p, { x: stage.x, y: y + 4, w: stage.w, h: 140 }, g);
  },
};
