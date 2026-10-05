"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { VIZ_LIST, getVizMeta } from "@/lib/viz/registry";
import { NumberField, SelectField } from "@/components/ui/fields";
import {
  FORMATS,
  THEMES,
  getFormat,
  getTheme,
  loadAssets,
  renderPoster,
  type Field,
  type Hit,
  type VizDef,
  type VizState,
} from "./engine";
import { VIZ_DEFS } from "./defs";

type Raw = Record<string, string | undefined>;

/** Merge URL params over the visualizer's defaults, keeping only valid values. */
function parseState(def: VizDef, raw: Raw): VizState {
  const out: VizState = { ...def.defaults };
  for (const key of Object.keys(def.defaults)) {
    const v = raw[key];
    if (v === undefined) continue;
    const field = def.fields.find((f) => f.key === key);
    if (!field || field.kind === "text") out[key] = v.slice(0, field && "maxLength" in field ? field.maxLength ?? 60 : 60);
    else if (field.kind === "select") {
      if (field.options.some((o) => o.value === v)) out[key] = v;
    } else {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 0) out[key] = Math.min(n, 1e12);
    }
  }
  return out;
}

function track(path: string) {
  window.goatcounter?.count?.({ path, event: true });
}

const DPR_CAP = 2;

export function VizStudio({ slug, initial }: { slug: string; initial: Raw }) {
  const def = VIZ_DEFS[slug];
  const meta = getVizMeta(slug)!;
  const { lang, t } = useLanguage();

  const [state, setState] = useState<VizState>(() => parseState(def, initial));
  const [themeId, setThemeId] = useState(() => getTheme(initial.theme).id);
  const [formatId, setFormatId] = useState(() => getFormat(initial.fmt).id);
  const [by, setBy] = useState(() => (initial.by ?? "").slice(0, 30));
  const [notice, setNotice] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const printRef = useRef<HTMLImageElement>(null);
  const hitsRef = useRef<Hit[]>([]);
  const format = getFormat(formatId);
  const theme = getTheme(themeId);

  const input = useCallback(
    () => ({ def, state, theme, format, lang, by }),
    [def, state, theme, format, lang, by]
  );

  // Draw the preview (once fonts are in, then on every change).
  useEffect(() => {
    let cancelled = false;
    const paint = () => {
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      const dpr = Math.min(DPR_CAP, window.devicePixelRatio || 1);
      canvas.width = format.W * dpr;
      canvas.height = format.H * dpr;
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      hitsRef.current = renderPoster(ctx, input());
    };
    paint();
    loadAssets().then(paint);
    return () => {
      cancelled = true;
    };
  }, [input, format]);

  // Keep the URL in step so "copy link" (or just the address bar) reproduces this poster.
  useEffect(() => {
    const id = setTimeout(() => {
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(state)) if (v !== def.defaults[k]) q.set(k, String(v));
      if (themeId !== THEMES[0].id) q.set("theme", themeId);
      if (formatId !== FORMATS[0].id) q.set("fmt", formatId);
      if (by.trim()) q.set("by", by.trim());
      const qs = q.toString();
      window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    }, 300);
    return () => clearTimeout(id);
  }, [state, themeId, formatId, by, def]);

  function set(key: string, value: string | number) {
    setState((s) => {
      const next = { ...s, [key]: value };
      return def.onFieldChange ? def.onFieldChange(s, next, key) : next;
    });
  }

  function onCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!def.onHit) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * format.W;
    const y = ((e.clientY - rect.top) / rect.height) * format.H;
    const hit = hitsRef.current.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
    if (hit) setState((s) => def.onHit!(s, hit.id));
  }

  /** Render off-screen at `scale`× for a crisp download/print. */
  async function exportCanvas(scale: number): Promise<HTMLCanvasElement> {
    await loadAssets();
    const c = document.createElement("canvas");
    c.width = format.W * scale;
    c.height = format.H * scale;
    const ctx = c.getContext("2d")!;
    ctx.scale(scale, scale);
    renderPoster(ctx, input());
    return c;
  }

  function toBlob(c: HTMLCanvasElement): Promise<Blob | null> {
    return new Promise((resolve) => c.toBlob(resolve, "image/png"));
  }

  const filename = `takatalks-${slug.replace(/_/g, "-")}.png`;

  async function download() {
    const blob = await toBlob(await exportCanvas(2));
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    track(`viz-download/${slug}`);
  }

  async function share() {
    const blob = await toBlob(await exportCanvas(2));
    const url = window.location.href;
    const file = blob ? new File([blob], filename, { type: "image/png" }) : null;
    const text = t(`${meta.title.en} — make yours at TakaTalks`, `${meta.title.bn} — নিজেরটা বানান TakaTalks-এ`);
    try {
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: meta.title.en, text: `${text}\n${url}` });
        track(`viz-share/${slug}`);
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: meta.title.en, text, url });
        track(`viz-share/${slug}`);
        return;
      }
    } catch {
      return; // user closed the share sheet
    }
    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice(t("Link copied — anyone who opens it sees this poster.", "লিংক কপি হয়েছে — যে খুলবে সে এই পোস্টারটাই দেখবে।"));
      track(`viz-copylink/${slug}`);
    } catch {
      setNotice(window.location.href);
    }
  }

  async function print() {
    const img = printRef.current;
    if (!img) return;
    const c = await exportCanvas(3);
    img.onload = () => {
      window.print();
      track(`viz-print/${slug}`);
    };
    img.src = c.toDataURL("image/png");
  }

  return (
    <div className="flex-1 bg-paper">
      <style>{`@media print {
        body * { visibility: hidden !important; }
        #viz-print, #viz-print * { visibility: visible !important; }
        #viz-print { display: block !important; position: fixed; inset: 0; }
        #viz-print img { width: 100%; height: 100%; object-fit: contain; }
        @page { margin: 8mm; }
      }`}</style>
      <div id="viz-print" className="hidden" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- data: URL generated at print time */}
        <img ref={printRef} alt="" />
      </div>

      <header className="bg-green-deep text-paper px-5 pt-6 pb-5 border-b-4 border-gold">
        <div className="max-w-[1160px] mx-auto">
          <Link href="/viz" className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] hover:text-paper">
            ← {t("ALL VISUALIZERS", "সব ভিজ্যুয়ালাইজার")}
          </Link>
          <h1 className="font-serif font-semibold text-2xl sm:text-3xl mt-1.5 mb-1">
            <span aria-hidden="true">{meta.icon} </span>
            {t(meta.title.en, meta.title.bn)}
          </h1>
          <p className="max-w-[720px] text-sm text-[#DCE6DD]">{t(meta.hook.en, meta.hook.bn)}</p>
        </div>
      </header>

      <div className="max-w-[1160px] mx-auto px-5 py-6 grid gap-6 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* Preview first on phones — it's the fun part. */}
        <section className="md:order-2">
          <div className="mx-auto" style={{ maxWidth: formatId === "story" ? 400 : 500 }}>
            <canvas
              ref={canvasRef}
              onClick={onCanvasClick}
              role="img"
              aria-label={t(meta.title.en, meta.title.bn)}
              className={`w-full h-auto shadow-lg border border-line bg-card ${def.onHit ? "cursor-pointer" : ""}`}
              style={{ aspectRatio: `${format.W} / ${format.H}` }}
            />
            {def.onHit && (
              <p className="text-xs text-muted text-center mt-2">
                {t("Tap a box on the poster to tick it off.", "পোস্টারের ঘরে ট্যাপ করে টিক দিন।")}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                onClick={download}
                className="col-span-2 bg-green text-paper font-semibold py-3 rounded-sm hover:bg-green-deep transition-colors"
              >
                ⬇ {t("Download picture", "ছবি ডাউনলোড করুন")}
              </button>
              <button
                type="button"
                onClick={share}
                className="border border-green text-green font-semibold py-2.5 rounded-sm hover:bg-green hover:text-paper transition-colors"
              >
                ↗ {t("Share", "শেয়ার")}
              </button>
              <button
                type="button"
                onClick={print}
                className="border border-green text-green font-semibold py-2.5 rounded-sm hover:bg-green hover:text-paper transition-colors"
              >
                🖨 {t("Print for wall", "দেয়ালের জন্য প্রিন্ট")}
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="col-span-2 text-sm text-green underline underline-offset-2 py-1"
              >
                {t("Copy link to this poster", "এই পোস্টারের লিংক কপি করুন")}
              </button>
            </div>
            {notice && (
              <p role="status" className="text-xs text-center text-muted mt-1 break-all">
                {notice}
              </p>
            )}
          </div>
        </section>

        <section className="md:order-1 flex flex-col gap-4">
          <div className="border border-line bg-card p-4 flex flex-col gap-3">
            <p className="font-serif font-semibold text-green-deep">{t("Your numbers", "আপনার হিসাব")}</p>
            {def.fields.map((f) => (
              <FieldInput key={f.key} field={f} value={state[f.key]} onChange={(v) => set(f.key, v)} />
            ))}
            {def.reset && (
              <button
                type="button"
                onClick={() => setState((s) => ({ ...s, ...def.reset!.state }))}
                className="self-start text-xs text-red underline underline-offset-2"
              >
                {t(def.reset.label.en, def.reset.label.bn)}
              </button>
            )}
          </div>

          <div className="border border-line bg-card p-4 flex flex-col gap-3">
            <p className="font-serif font-semibold text-green-deep">{t("Make it yours", "নিজের মতো সাজান")}</p>
            <TextInput
              label={t("Your name (optional)", "আপনার নাম (ঐচ্ছিক)")}
              value={by}
              maxLength={30}
              onChange={setBy}
            />
            <div>
              <p className="text-xs text-[#555] mb-1.5">{t("Style", "স্টাইল")}</p>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    aria-pressed={th.id === themeId}
                    onClick={() => setThemeId(th.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 border text-xs text-left rounded-sm ${
                      th.id === themeId ? "border-green ring-2 ring-green/30" : "border-line"
                    }`}
                  >
                    <span className="flex shrink-0">
                      {[th.bg, th.accent, th.accent2].map((c) => (
                        <span key={c} className="w-3.5 h-3.5 border border-black/10" style={{ background: c }} />
                      ))}
                    </span>
                    {t(th.name.en, th.name.bn)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-[#555] mb-1.5">{t("Size", "সাইজ")}</p>
              <div className="flex gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={f.id === formatId}
                    onClick={() => setFormatId(f.id)}
                    className={`flex-1 px-2 py-1.5 border text-xs rounded-sm ${
                      f.id === formatId ? "border-green bg-green text-paper" : "border-line"
                    }`}
                  >
                    {t(f.name.en, f.name.bn)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted">
            {t(
              "Everything stays on your device. Your numbers only travel if you share the link.",
              "সব হিসাব আপনার ডিভাইসেই থাকে। লিংক শেয়ার করলেই কেবল সংখ্যাগুলো যায়।"
            )}
          </p>
        </section>
      </div>

      <section className="max-w-[1160px] mx-auto px-5 pb-12">
        <p className="font-mono text-[11px] tracking-wider text-muted mb-3">{t("TRY ANOTHER", "আরও দেখুন")}</p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {VIZ_LIST.filter((v) => v.slug !== slug).map((v) => (
            <Link
              key={v.slug}
              href={`/viz/${v.slug}`}
              className="shrink-0 w-44 border border-line bg-card p-3 hover:border-green transition-colors"
            >
              <span className="text-2xl" aria-hidden="true">
                {v.icon}
              </span>
              <p className="text-sm font-semibold mt-1 leading-snug">{t(v.title.en, v.title.bn)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-[#555] mb-1">{label}</span>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm text-ink focus:outline-none focus:border-green focus:ring-2 focus:ring-green/30"
      />
    </label>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string | number | undefined;
  onChange: (v: string | number) => void;
}) {
  const { t } = useLanguage();
  const label = t(field.label.en, field.label.bn);
  switch (field.kind) {
    case "text":
      return <TextInput label={label} value={String(value ?? "")} maxLength={field.maxLength} onChange={onChange} />;
    case "select":
      if (field.options.length <= 4) {
        return (
          <div>
            <p className="text-xs text-[#555] mb-1.5">{label}</p>
            <div className="flex flex-wrap gap-1.5">
              {field.options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={o.value === value}
                  onClick={() => onChange(o.value)}
                  className={`px-2.5 py-1.5 border text-xs rounded-sm ${
                    o.value === value ? "border-green bg-green text-paper" : "border-line hover:border-green"
                  }`}
                >
                  {t(o.label.en, o.label.bn)}
                </button>
              ))}
            </div>
          </div>
        );
      }
      return (
        <SelectField
          label={label}
          value={String(value)}
          onChange={onChange}
          options={field.options.map((o) => ({ value: o.value, label: t(o.label.en, o.label.bn) }))}
        />
      );
    case "percent":
    case "number":
      return (
        <NumberField
          label={field.kind === "percent" ? `${label} (%)` : label}
          value={Number(value) || 0}
          currency={false}
          onChange={onChange}
        />
      );
    default:
      return <NumberField label={label} value={Number(value) || 0} onChange={onChange} />;
  }
}
