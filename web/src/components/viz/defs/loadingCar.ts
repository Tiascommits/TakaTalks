import { fmtPct, fmtTakaShort } from "@/lib/viz/math";
import { fillRound, text, type VizDef } from "../engine";
import { goal, goalFields, goalStats, str, tierLine } from "./common";

type Vehicle = "car" | "bike" | "cng";

/** Side-view silhouettes in a 300×130 box, filled in one colour; `hole` punches windows/hubs. */
function vehicle(ctx: CanvasRenderingContext2D, kind: Vehicle, fill: string, hole: string) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = fill;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const wheel = (x: number, y: number, r: number) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hole;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  };

  if (kind === "car") {
    ctx.beginPath();
    ctx.moveTo(12, 92);
    ctx.lineTo(12, 66);
    ctx.quadraticCurveTo(16, 56, 34, 54);
    ctx.lineTo(88, 50);
    ctx.quadraticCurveTo(112, 22, 140, 21);
    ctx.lineTo(186, 21);
    ctx.quadraticCurveTo(206, 22, 232, 48);
    ctx.lineTo(276, 54);
    ctx.quadraticCurveTo(294, 58, 292, 78);
    ctx.lineTo(290, 92);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = hole;
    ctx.beginPath();
    ctx.moveTo(108, 49);
    ctx.quadraticCurveTo(124, 30, 142, 29);
    ctx.lineTo(160, 29);
    ctx.lineTo(160, 49);
    ctx.closePath();
    ctx.moveTo(168, 29);
    ctx.lineTo(186, 29);
    ctx.quadraticCurveTo(198, 31, 216, 49);
    ctx.lineTo(168, 49);
    ctx.closePath();
    ctx.fill();
    wheel(72, 92, 24);
    wheel(234, 92, 24);
  } else if (kind === "bike") {
    ctx.lineWidth = 9;
    for (const x of [62, 238]) {
      ctx.beginPath();
      ctx.arc(x, 96, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, 96, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(62, 96);
    ctx.lineTo(118, 68);
    ctx.lineTo(196, 70);
    ctx.lineTo(238, 96);
    ctx.moveTo(238, 96);
    ctx.lineTo(212, 26);
    ctx.moveTo(200, 22);
    ctx.lineTo(228, 18);
    ctx.stroke();
    // Tank, seat, engine block, rear fender
    ctx.beginPath();
    ctx.moveTo(122, 50);
    ctx.quadraticCurveTo(150, 34, 196, 40);
    ctx.lineTo(204, 60);
    ctx.lineTo(128, 66);
    ctx.closePath();
    ctx.fill();
    fillRound(ctx, { x: 70, y: 46, w: 62, h: 14 }, 7, fill);
    fillRound(ctx, { x: 120, y: 66, w: 64, h: 34 }, 6, fill);
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(62, 96, 40, Math.PI * 1.1, Math.PI * 1.55);
    ctx.stroke();
  } else {
    // CNG auto-rickshaw: domed cabin with meshed doors.
    ctx.beginPath();
    ctx.moveTo(28, 98);
    ctx.lineTo(28, 52);
    ctx.quadraticCurveTo(32, 16, 84, 12);
    ctx.lineTo(196, 12);
    ctx.quadraticCurveTo(244, 14, 258, 52);
    ctx.lineTo(276, 82);
    ctx.lineTo(276, 98);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = hole;
    fillRound(ctx, { x: 58, y: 30, w: 76, h: 44 }, 8, hole);
    fillRound(ctx, { x: 150, y: 30, w: 84, h: 44 }, 8, hole);
    ctx.lineWidth = 3;
    ctx.strokeStyle = fill;
    for (let x = 66; x < 232; x += 12) {
      if (x > 132 && x < 152) continue;
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.lineTo(x, 74);
      ctx.stroke();
    }
    wheel(76, 100, 20);
    wheel(226, 100, 20);
  }
}

const PRESET_NAMES: Record<Vehicle, string> = { car: "Toyota Axio", bike: "Yamaha R15", cng: "Bajaj RE CNG" };

export const loadingCar: VizDef = {
  slug: "loading_car",
  fields: [
    {
      key: "vehicle",
      kind: "select",
      label: { en: "What are you saving for?", bn: "কীসের জন্য জমাচ্ছেন?" },
      options: [
        { value: "car", label: { en: "Car 🚗", bn: "গাড়ি 🚗" } },
        { value: "bike", label: { en: "Motorbike 🏍️", bn: "মোটরবাইক 🏍️" } },
        { value: "cng", label: { en: "CNG / auto 🛺", bn: "সিএনজি 🛺" } },
      ],
    },
    ...goalFields({ en: "Model name", bn: "মডেলের নাম" }),
  ],
  defaults: { vehicle: "car", name: "Toyota Axio", price: 2_500_000, saved: 650_000, monthly: 40_000 },
  onFieldChange(prev, next, key) {
    // Switching vehicle swaps the model name, unless the user typed their own.
    const v = next.vehicle as Vehicle;
    if (key === "vehicle" && Object.values(PRESET_NAMES).includes(str(prev, "name")) && PRESET_NAMES[v]) {
      return { ...next, name: PRESET_NAMES[v] };
    }
    return next;
  },
  header: (s, lang) => ({
    eyebrow: lang === "en" ? "Dream loader · v1.0" : "স্বপ্ন লোড হচ্ছে · v1.0",
    title: str(s, "name") || (lang === "en" ? "My dream ride" : "আমার স্বপ্নের বাহন"),
    subtitle: lang === "en" ? "Downloading, one taka at a time" : "টাকায় টাকায় ডাউনলোড হচ্ছে",
  }),
  draw(p, s) {
    const { ctx, stage, theme, lang, t } = p;
    const g = goal(s);
    const kind = (["car", "bike", "cng"].includes(str(s, "vehicle")) ? str(s, "vehicle") : "car") as Vehicle;
    const contentH = 850;
    const y0 = stage.y + Math.max(0, (stage.h - contentH) / 2);

    // Vehicle: ghost outline, then the "downloaded" part clipped to progress.
    const scale = stage.w / 300;
    const vx = stage.x;
    const vy = y0 + 10;
    const vh = 130 * scale;
    ctx.save();
    ctx.translate(vx, vy);
    ctx.scale(scale, scale);
    vehicle(ctx, kind, theme.empty, theme.bg);
    ctx.beginPath();
    ctx.rect(0, 0, 300 * g.pct, 140);
    ctx.clip();
    vehicle(ctx, kind, theme.accent, theme.bg);
    ctx.restore();
    // Scan line at the loading edge.
    if (g.pct > 0 && g.pct < 1) {
      const sx = vx + stage.w * g.pct;
      ctx.save();
      ctx.strokeStyle = theme.accent2;
      ctx.lineWidth = 5;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(sx, vy - 10);
      ctx.lineTo(sx, vy + vh);
      ctx.stroke();
      ctx.restore();
    }
    // Road
    ctx.fillStyle = theme.ink;
    ctx.globalAlpha = 0.15;
    ctx.fillRect(stage.x - 20, vy + vh + 6, stage.w + 40, 6);
    ctx.globalAlpha = 1;

    // LOADING… 42%
    let y = vy + vh + 110;
    const loadingLabel = g.pct >= 1 ? t("DOWNLOAD COMPLETE", "ডাউনলোড সম্পূর্ণ") : t("LOADING…", "লোড হচ্ছে…");
    text(ctx, loadingLabel, stage.x, y - 14, { size: 30, weight: 500, family: "mono", color: theme.muted });
    text(ctx, fmtPct(g.pct, lang), stage.x + stage.w, y, {
      size: 120,
      weight: 700,
      family: "serif",
      color: theme.accent,
      align: "right",
    });

    // Segmented progress bar, retro installer style.
    y += 30;
    const segs = 24;
    const gap = 6;
    const sw = (stage.w - gap * (segs - 1)) / segs;
    const filled = g.pct * segs;
    for (let i = 0; i < segs; i++) {
      const x = stage.x + i * (sw + gap);
      fillRound(ctx, { x, y, w: sw, h: 54 }, 6, theme.empty);
      const part = Math.min(1, Math.max(0, filled - i));
      if (part > 0) fillRound(ctx, { x, y, w: sw * part, h: 54 }, 6, i % 2 ? theme.accent : theme.accent2);
    }
    y += 54 + 44;
    text(ctx, `${fmtTakaShort(g.saved, lang)} / ${fmtTakaShort(g.price, lang)}`, stage.x, y, {
      size: 26,
      weight: 500,
      family: "mono",
      color: theme.muted,
    });

    const line = tierLine(g.pct, [
      [0, t("Booting up the dream…", "স্বপ্ন চালু হচ্ছে…")],
      [0.1, t("Wheels downloaded 🛞", "চাকা ডাউনলোড হয়েছে 🛞")],
      [0.25, t("Engine installed ⚙️", "ইঞ্জিন বসানো হয়েছে ⚙️")],
      [0.5, t("Halfway! Seats & AC fitted ❄️", "অর্ধেক পথ! সিট আর এসি লাগানো ❄️")],
      [0.75, t("Paint job & polish ✨", "রং আর পালিশ চলছে ✨")],
      [0.9, t("Almost there — testing the horn 📯", "প্রায় শেষ — হর্ন টেস্ট চলছে 📯")],
      [1, t("Ready to ride! 🎉", "চালানোর জন্য প্রস্তুত! 🎉")],
    ]);
    text(ctx, line, stage.x + stage.w, y, {
      size: 28,
      weight: 600,
      color: theme.ink,
      align: "right",
      maxW: stage.w * 0.62,
    });

    goalStats(p, { x: stage.x, y: y + 40, w: stage.w, h: 140 }, g);
  },
};
