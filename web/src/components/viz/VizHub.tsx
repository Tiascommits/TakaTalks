"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { VIZ_LIST } from "@/lib/viz/registry";

export function VizHub() {
  const { t } = useLanguage();
  return (
    <div className="flex-1 bg-paper">
      <header className="bg-green-deep text-paper px-5 pt-8 pb-7 border-b-4 border-gold">
        <div className="max-w-[1160px] mx-auto">
          <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
            {t("SEE IT · SHARE IT · STICK IT ON THE WALL", "দেখুন · শেয়ার করুন · দেয়ালে লাগান")}
          </p>
          <h1 className="font-serif font-semibold text-3xl sm:text-4xl mb-2">
            {t("Money Visualizers", "টাকার ভিজ্যুয়ালাইজার")}
          </h1>
          <p className="max-w-[680px] text-sm text-[#DCE6DD]">
            {t(
              "Your dream car, your flat, your freedom date — turned into a poster. Fill in a few numbers, pick a style, then download it, print it for the wall, or show your friends.",
              "স্বপ্নের গাড়ি, ফ্ল্যাট, আর্থিক স্বাধীনতার দিন — এক পোস্টারে। কয়েকটা সংখ্যা দিন, স্টাইল বাছুন, তারপর ডাউনলোড করুন, দেয়ালের জন্য প্রিন্ট করুন বা বন্ধুদের দেখান।"
            )}
          </p>
        </div>
      </header>

      <div className="max-w-[1160px] mx-auto px-5 py-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {VIZ_LIST.map((v) => (
          <Link
            key={v.slug}
            href={`/viz/${v.slug}`}
            className="group border border-line bg-card p-5 flex flex-col gap-2 hover:border-green hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-4xl" aria-hidden="true">
                {v.icon}
              </span>
              <span className="font-mono text-[10px] tracking-wider text-gold border border-gold/40 px-1.5 py-0.5">
                {t(v.tag.en, v.tag.bn)}
              </span>
            </div>
            <h2 className="font-serif font-semibold text-xl text-green-deep group-hover:text-green">
              {t(v.title.en, v.title.bn)}
            </h2>
            <p className="text-sm text-muted">{t(v.hook.en, v.hook.bn)}</p>
            <span className="mt-auto pt-2 text-sm font-semibold text-green">
              {t("Make mine →", "আমারটা বানাই →")}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
