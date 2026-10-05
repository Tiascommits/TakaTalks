/**
 * Canvas poster engine for /viz. Every visualizer draws into the same frame
 * (theme background, header, stage, footer with a small TakaTalks mark), so the
 * on-screen preview and the downloaded PNG are pixel-for-pixel the same thing.
 * Browser-only: call these from effects and event handlers, never on the server.
 */

import type { Lang } from "@/lib/viz/math";

// ---------------------------------------------------------------- types

export type L = { en: string; bn: string };
export type VizState = Record<string, string | number>;

export type Field =
  | { key: string; kind: "money" | "number" | "percent"; label: L; min?: number; max?: number; step?: number }
  | { key: string; kind: "text"; label: L; maxLength?: number }
  | { key: string; kind: "select"; label: L; options: { value: string; label: L }[] };

export type Box = { x: number; y: number; w: number; h: number };
export type Hit = Box & { id: string };

export type Poster = {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  stage: Box;
  theme: Theme;
  lang: Lang;
  t: (en: string, bn: string) => string;
};

export type VizDef = {
  slug: string;
  fields: Field[];
  defaults: VizState;
  header: (s: VizState, lang: Lang) => { eyebrow: string; title: string; subtitle?: string };
  /** Draw inside `p.stage`. May return tap targets (used by the 100-box challenge). */
  draw: (p: Poster, s: VizState) => Hit[] | void;
  onHit?: (s: VizState, id: string) => VizState;
  /** Adjust related values after a field edit (e.g. swap a preset name). */
  onFieldChange?: (prev: VizState, next: VizState, key: string) => VizState;
  /** Optional reset button label + the keys it clears. */
  reset?: { label: L; state: VizState };
};

// ---------------------------------------------------------------- themes

export type Theme = {
  id: string;
  name: L;
  bg: string;
  ink: string;
  muted: string;
  accent: string;
  accent2: string;
  empty: string;
  card: string;
  /** Text colour on top of `accent`. */
  onAccent: string;
};

export const THEMES: Theme[] = [
  {
    id: "sobuj",
    name: { en: "Sobuj", bn: "সবুজ" },
    bg: "#f8f6f0",
    ink: "#12231b",
    muted: "#6b6f63",
    accent: "#0b4f3f",
    accent2: "#d4a832",
    empty: "#e4e1d4",
    card: "#ffffff",
    onAccent: "#f8f6f0",
  },
  {
    id: "rickshaw",
    name: { en: "Rickshaw Art", bn: "রিকশা আর্ট" },
    bg: "#fff4d9",
    ink: "#1d1035",
    muted: "#6a5a7c",
    accent: "#d6006f",
    accent2: "#00a19a",
    empty: "#f2ddb0",
    card: "#fffaf0",
    onAccent: "#fff4d9",
  },
  {
    id: "raat",
    name: { en: "Dhaka Night", bn: "ঢাকার রাত" },
    bg: "#0e1a2b",
    ink: "#f4eedd",
    muted: "#93a0b4",
    accent: "#f2b134",
    accent2: "#4fd1a5",
    empty: "#22344c",
    card: "#142640",
    onAccent: "#0e1a2b",
  },
  {
    id: "nakshi",
    name: { en: "Nakshi Kantha", bn: "নকশিকাঁথা" },
    bg: "#f5ebdc",
    ink: "#3a1c12",
    muted: "#86695a",
    accent: "#a3222b",
    accent2: "#1f4e79",
    empty: "#e6d4bd",
    card: "#fbf4ea",
    onAccent: "#f5ebdc",
  },
];

export function getTheme(id: string | number | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

// ---------------------------------------------------------------- formats

export type Format = { id: string; name: L; W: number; H: number };

export const FORMATS: Format[] = [
  { id: "post", name: { en: "Post 4:5", bn: "পোস্ট ৪:৫" }, W: 1080, H: 1350 },
  { id: "story", name: { en: "Story 9:16", bn: "স্টোরি ৯:১৬" }, W: 1080, H: 1920 },
];

export function getFormat(id: string | number | undefined): Format {
  return FORMATS.find((f) => f.id === id) ?? FORMATS[0];
}

// ---------------------------------------------------------------- fonts & assets

type Family = "serif" | "sans" | "mono" | "emoji";
const families: Record<Family, string> = {
  serif: "Georgia, serif",
  sans: "system-ui, sans-serif",
  mono: "ui-monospace, monospace",
  emoji: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
};
let logo: HTMLImageElement | null = null;
let assetsPromise: Promise<void> | null = null;

/** Resolve the next/font family names and wait for the glyphs + logo. Idempotent. */
export function loadAssets(): Promise<void> {
  if (assetsPromise) return assetsPromise;
  const css = getComputedStyle(document.documentElement);
  const bengali = css.getPropertyValue("--font-noto-bengali").trim();
  const serif = css.getPropertyValue("--font-newsreader").trim();
  const mono = css.getPropertyValue("--font-plex-mono").trim();
  // Latin faces have no Bengali glyphs, so every stack ends in Noto Sans Bengali.
  if (bengali) families.sans = bengali;
  if (serif) families.serif = `${serif}, ${bengali}`;
  if (mono) families.mono = `${mono}, ${bengali}`;

  const fontLoads = [
    `700 40px ${families.serif}`,
    `600 40px ${families.serif}`,
    `400 40px ${families.sans}`,
    `600 40px ${families.sans}`,
    `700 40px ${families.sans}`,
    `500 40px ${families.mono}`,
  ].map((f) => document.fonts.load(f, "Aa০১ টাকা").catch(() => []));

  const logoLoad = new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      logo = img;
      resolve();
    };
    img.onerror = () => resolve();
    img.src = "/logo-mark.png";
  });

  assetsPromise = Promise.all([...fontLoads, logoLoad]).then(() => undefined);
  return assetsPromise;
}

export function font(weight: number, size: number, family: Family = "sans"): string {
  return `${weight} ${Math.round(size)}px ${families[family]}`;
}

// ---------------------------------------------------------------- drawing helpers

export type TextOpts = {
  size: number;
  weight?: number;
  family?: Family;
  color: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  /** Shrink the font until the text fits this width. */
  maxW?: number;
  alpha?: number;
};

export function text(ctx: CanvasRenderingContext2D, str: string, x: number, y: number, o: TextOpts): number {
  let size = o.size;
  const weight = o.weight ?? 400;
  ctx.font = font(weight, size, o.family);
  if (o.maxW) {
    while (size > 8 && ctx.measureText(str).width > o.maxW) {
      size -= 1;
      ctx.font = font(weight, size, o.family);
    }
  }
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.fillStyle = o.color;
  ctx.textAlign = o.align ?? "left";
  ctx.textBaseline = o.baseline ?? "alphabetic";
  ctx.fillText(str, x, y);
  ctx.restore();
  return size;
}

/** Greedy word-wrap; returns the lines (at most `maxLines`, last one ellipsised). */
export function wrap(ctx: CanvasRenderingContext2D, str: string, maxW: number, maxLines: number): string[] {
  const words = str.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width <= maxW || !line) line = next;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1] + "…";
    return kept;
  }
  return lines;
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function fillRound(ctx: CanvasRenderingContext2D, b: Box, r: number, color: string) {
  roundRect(ctx, b.x, b.y, b.w, b.h, r);
  ctx.fillStyle = color;
  ctx.fill();
}

/** Deterministic pseudo-random sequence so decorations don't jitter between redraws. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

/** A row of equal stat cards: small label above, big value below. */
export function statRow(
  p: Poster,
  box: Box,
  items: { label: string; value: string; highlight?: boolean }[],
  gap = 18
) {
  const { ctx, theme } = p;
  const w = (box.w - gap * (items.length - 1)) / items.length;
  items.forEach((it, i) => {
    const x = box.x + i * (w + gap);
    fillRound(ctx, { x, y: box.y, w, h: box.h }, 18, it.highlight ? theme.accent : theme.card);
    if (!it.highlight) {
      roundRect(ctx, x, box.y, w, box.h, 18);
      ctx.strokeStyle = theme.empty;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    const fg = it.highlight ? theme.onAccent : theme.ink;
    text(ctx, it.label.toUpperCase(), x + w / 2, box.y + box.h * 0.36, {
      size: 20,
      weight: 500,
      family: "mono",
      color: it.highlight ? theme.onAccent : theme.muted,
      align: "center",
      maxW: w - 24,
      alpha: it.highlight ? 0.85 : 1,
    });
    text(ctx, it.value, x + w / 2, box.y + box.h * 0.78, {
      size: 38,
      weight: 700,
      family: "serif",
      color: fg,
      align: "center",
      maxW: w - 24,
    });
  });
}

// ---------------------------------------------------------------- frame

function drawDecor(ctx: CanvasRenderingContext2D, theme: Theme, W: number, H: number) {
  ctx.save();
  if (theme.id === "rickshaw") {
    // Rickshaw-art border: a band of alternating bright triangles and dots.
    const band = 26;
    const colors = [theme.accent, theme.accent2, "#f7b500", "#3a2ba8"];
    const step = 36;
    const edge = (len: number, place: (i: number) => [number, number, number]) => {
      for (let i = 0; i * step < len; i++) {
        const [x, y, rot] = place(i);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(step, 0);
        ctx.lineTo(step / 2, band);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(step / 2, band * 0.35, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };
    edge(W, (i) => [i * step, 0, 0]);
    edge(W, (i) => [W - i * step, H, Math.PI]);
    edge(H, (i) => [0, H - i * step, -Math.PI / 2]);
    edge(H, (i) => [W, i * step, Math.PI / 2]);
  } else if (theme.id === "nakshi") {
    // Kantha running-stitch borders with diamond corners.
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 10]);
    ctx.strokeRect(26, 26, W - 52, H - 52);
    ctx.strokeStyle = theme.accent2;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 10]);
    ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.setLineDash([]);
    ctx.fillStyle = theme.accent;
    for (const [x, y] of [
      [33, 33],
      [W - 33, 33],
      [33, H - 33],
      [W - 33, H - 33],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x, y - 14);
      ctx.lineTo(x + 14, y);
      ctx.lineTo(x, y + 14);
      ctx.lineTo(x - 14, y);
      ctx.closePath();
      ctx.fill();
    }
  } else if (theme.id === "raat") {
    const r = rng(7);
    for (let i = 0; i < 90; i++) {
      ctx.globalAlpha = 0.15 + r() * 0.5;
      ctx.fillStyle = r() > 0.85 ? theme.accent : theme.ink;
      ctx.beginPath();
      ctx.arc(r() * W, r() * H, 0.8 + r() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, W - 48, H - 48);
  } else {
    ctx.fillStyle = theme.accent;
    ctx.fillRect(0, 0, W, 14);
    ctx.strokeStyle = theme.empty;
    ctx.lineWidth = 3;
    ctx.strokeRect(28, 42, W - 56, H - 70);
  }
  ctx.restore();
}

export type RenderInput = {
  def: VizDef;
  state: VizState;
  theme: Theme;
  format: Format;
  lang: Lang;
  /** Who made it — printed in the footer. */
  by: string;
};

/**
 * Draw the full poster at logical size `format.W × format.H`. The caller sets
 * any device-pixel scaling on `ctx` beforehand. Returns the visualizer's tap
 * targets in logical coordinates.
 */
export function renderPoster(ctx: CanvasRenderingContext2D, input: RenderInput): Hit[] {
  const { def, state, theme, format, lang } = input;
  const { W, H } = format;
  const t = (en: string, bn: string) => (lang === "en" ? en : bn);
  const story = H / W > 1.5;
  const pad = 80;

  ctx.save();
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);
  drawDecor(ctx, theme, W, H);

  // Header — stories leave room up top for the app's own overlay.
  const top = story ? 230 : 100;
  const head = def.header(state, lang);
  text(ctx, head.eyebrow.toUpperCase(), W / 2, top, {
    size: 22,
    weight: 500,
    family: "mono",
    color: theme.accent,
    align: "center",
    maxW: W - pad * 2,
  });
  ctx.font = font(700, 62, "serif");
  const titleLines = wrap(ctx, head.title, W - pad * 2, 2);
  titleLines.forEach((line, i) => {
    text(ctx, line, W / 2, top + 76 + i * 70, {
      size: 62,
      weight: 700,
      family: "serif",
      color: theme.ink,
      align: "center",
      maxW: W - pad * 2,
    });
  });
  let headBottom = top + 76 + (titleLines.length - 1) * 70;
  if (head.subtitle) {
    text(ctx, head.subtitle, W / 2, headBottom + 50, {
      size: 28,
      color: theme.muted,
      align: "center",
      maxW: W - pad * 2,
    });
    headBottom += 50;
  }

  // Footer
  const footY = story ? H - 250 : H - 78;
  const stage: Box = { x: pad, y: headBottom + 50, w: W - pad * 2, h: footY - 60 - (headBottom + 50) };
  const hits = def.draw({ ctx, W, H, stage, theme, lang, t }, state) ?? [];

  if (input.by.trim()) {
    text(ctx, t(`— ${input.by.trim()}'s board`, `— ${input.by.trim()}-এর বোর্ড`), pad, footY, {
      size: 26,
      weight: 600,
      family: "serif",
      color: theme.ink,
      maxW: W / 2,
    });
  }
  // The watermark: deliberately small and quiet.
  ctx.save();
  ctx.globalAlpha = 0.6;
  const mark = "takatalks.com/viz";
  ctx.font = font(500, 19, "mono");
  const mw = ctx.measureText(mark).width;
  text(ctx, mark, W - pad, footY, { size: 19, weight: 500, family: "mono", color: theme.muted, align: "right" });
  if (logo) ctx.drawImage(logo, W - pad - mw - 30, footY - 19, 22, 22);
  ctx.restore();

  ctx.restore();
  return hits;
}
