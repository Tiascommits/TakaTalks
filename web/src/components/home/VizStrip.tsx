"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { VIZ_LIST } from "@/lib/viz/registry";

/** One compact row of links into /viz, right under the tool picker. */
export function VizStrip() {
  const { t } = useLanguage();
  return (
    <section className="max-w-[1160px] mx-auto px-5 pb-10 w-full">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <h2 className="font-serif font-bold text-lg sm:text-xl text-green-deep">
          {t("Visualize it, share it", "ছবিতে দেখুন, শেয়ার করুন")}
        </h2>
        <Link href="/viz" className="shrink-0 font-mono text-[10px] tracking-wider text-green hover:underline">
          {t("ALL VISUALIZERS →", "সব ভিজ্যুয়ালাইজার →")}
        </Link>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
        {VIZ_LIST.map((v) => (
          <Link
            key={v.slug}
            href={`/viz/${v.slug}`}
            className="shrink-0 flex items-center gap-2 border border-line bg-card px-3 py-2 text-sm hover:border-green transition-colors"
          >
            <span aria-hidden="true">{v.icon}</span>
            {t(v.title.en, v.title.bn)}
          </Link>
        ))}
      </div>
    </section>
  );
}
