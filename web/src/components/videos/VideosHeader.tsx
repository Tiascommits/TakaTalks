"use client";

import { useLanguage } from "@/lib/i18n";

export function VideosHeader() {
  const { t } = useLanguage();

  return (
    <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
      <div className="max-w-[1160px] mx-auto">
        <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
          {t("SHORTFORM & LONGFORM MONEY CONTENT", "শর্টফর্ম ও লংফর্ম মানি কনটেন্ট")}
        </p>
        <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1.5">
          {t("Videos — TakaTalks", "ভিডিও — টাকাটকস")}
        </h1>
        <p className="max-w-[720px] text-sm text-[#DCE6DD]">
          {t(
            "Watch the video, then run your own numbers right next to it. Quick hooks and rapid tips live in Shortform, deep dives on a single topic live in Longform.",
            "ভিডিও দেখুন, তারপর পাশের টুলে নিজের হিসাব করুন। দ্রুত টিপস শর্টফর্মে, একটি বিষয়ে বিস্তারিত আলোচনা লংফর্মে।"
          )}
        </p>
      </div>
    </header>
  );
}
