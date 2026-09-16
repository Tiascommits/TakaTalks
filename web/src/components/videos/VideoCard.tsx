"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { VideoEmbed } from "@/components/videos/VideoEmbed";
import type { VideoEntry } from "@/config/videos";

export function VideoCard({ video }: { video: VideoEntry }) {
  const { t } = useLanguage();

  return (
    <div className="bg-card border border-line rounded-sm overflow-hidden flex flex-col">
      <div className="bg-black" style={{ aspectRatio: `${video.width} / ${video.height}` }}>
        <VideoEmbed video={video} title={t(video.title.en, video.title.bn)} />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h3 className="font-serif font-bold text-base text-green-deep">
          {t(video.title.en, video.title.bn)}
        </h3>
        <p className="text-xs text-[#555] leading-relaxed">
          {t(video.description.en, video.description.bn)}
        </p>
        {video.relatedTool && (
          <Link
            href={video.relatedTool.href}
            className="mt-2 text-xs font-semibold text-green-deep hover:text-gold transition-colors self-start"
          >
            {t(video.relatedTool.label.en, video.relatedTool.label.bn)} →
          </Link>
        )}
      </div>
    </div>
  );
}
