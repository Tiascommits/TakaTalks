"use client";

import { useState } from "react";
import { buildEmbedUrl, youtubeThumbnailUrl } from "@/lib/videos/embed";
import { useLanguage } from "@/lib/i18n";
import type { VideoEntry } from "@/config/videos";

/**
 * YouTube videos show a still and load the player (about 1 MB) only when
 * tapped, so the homepage stays light on a slow phone connection.
 */
export function VideoEmbed({ video, title }: { video: VideoEntry; title: string }) {
  const { t } = useLanguage();
  const [playing, setPlaying] = useState(video.platform !== "youtube");

  if (!playing) {
    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        aria-label={t(`Play video: ${title}`, `ভিডিও চালান: ${title}`)}
        className="group relative w-full h-full bg-black bg-cover bg-center focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-light"
        style={{ backgroundImage: `url(${youtubeThumbnailUrl(video.url)})` }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-black/70 text-2xl text-white group-hover:bg-red transition-colors"
        >
          ▶
        </span>
      </button>
    );
  }

  const src = buildEmbedUrl(video.platform, video.url);
  return (
    <iframe
      src={video.platform === "youtube" ? `${src}?autoplay=1` : src}
      className="w-full h-full"
      allow="autoplay; encrypted-media; picture-in-picture; web-share"
      allowFullScreen
      loading="lazy"
      title={title}
    />
  );
}
