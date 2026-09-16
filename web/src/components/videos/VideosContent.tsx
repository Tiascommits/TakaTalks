"use client";

import { useLanguage } from "@/lib/i18n";
import { SHORT_VIDEOS, LONG_VIDEOS } from "@/config/videos";
import { VideoCard } from "@/components/videos/VideoCard";
import { EmptyVideoState } from "@/components/videos/EmptyVideoState";

export function VideosContent() {
  const { t } = useLanguage();

  return (
    <div className="max-w-[1160px] mx-auto px-5 py-10 w-full flex flex-col gap-12">
      <section>
        <div className="mb-5">
          <h2 className="font-serif font-bold text-xl text-green-deep">
            {t("Shortform", "শর্টফর্ম")}
          </h2>
          <p className="text-xs text-muted mt-1">
            {t("Rapid hooks and quick tips, 30–60 seconds.", "দ্রুত টিপস, ৩০-৬০ সেকেন্ড।")}
          </p>
        </div>
        {SHORT_VIDEOS.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SHORT_VIDEOS.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <EmptyVideoState
            label={{ en: "More shorts coming soon.", bn: "আরও শর্ট ভিডিও শীঘ্রই আসছে।" }}
          />
        )}
      </section>

      <section>
        <div className="mb-5">
          <h2 className="font-serif font-bold text-xl text-green-deep">
            {t("Longform", "লংফর্ম")}
          </h2>
          <p className="text-xs text-muted mt-1">
            {t("Deep dives on a single topic, 3+ minutes.", "একটি বিষয়ে বিস্তারিত আলোচনা, ৩+ মিনিট।")}
          </p>
        </div>
        {LONG_VIDEOS.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {LONG_VIDEOS.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <EmptyVideoState
            label={{
              en: "More long-form videos coming soon.",
              bn: "আরও লংফর্ম ভিডিও শীঘ্রই আসছে।",
            }}
          />
        )}
      </section>
    </div>
  );
}
