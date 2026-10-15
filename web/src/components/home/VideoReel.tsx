"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { VIDEOS } from "@/config/videos";
import { VideoEmbed } from "@/components/videos/VideoEmbed";

// The homepage only ever features one clip, so pick the landscape one —
// a portrait short would letterbox badly beside the hero text.
const FEATURED = VIDEOS.find((v) => v.width > v.height) ?? VIDEOS[0];

/**
 * The featured video, sized to sit beside the homepage hero text. Embedded
 * from its hosting platform (YouTube/Facebook) rather than served from this repo.
 */
export function VideoReel() {
  const { t } = useLanguage();
  const title = t(FEATURED.title.en, FEATURED.title.bn);

  return (
    <div className="w-full">
      <div
        className="w-full rounded-sm overflow-hidden border border-line bg-black/80 shadow-md"
        style={{ aspectRatio: `${FEATURED.width} / ${FEATURED.height}` }}
      >
        <VideoEmbed video={FEATURED} title={title} />
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <p className="text-xs text-muted truncate">{title}</p>
        <Link
          href="/videos"
          className="shrink-0 font-mono text-[10px] tracking-wider text-green hover:underline"
        >
          {t("SEE ALL VIDEOS →", "সব ভিডিও →")}
        </Link>
      </div>
    </div>
  );
}
