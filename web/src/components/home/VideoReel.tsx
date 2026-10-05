"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { VIDEOS } from "@/config/videos";

// The homepage only ever features one clip, so pick the landscape one —
// a portrait short would letterbox badly beside the hero text.
const FEATURED = VIDEOS.find((v) => v.width > v.height) ?? VIDEOS[0];

/**
 * The featured video, sized to sit beside the homepage hero text. Autoplays
 * (muted, so the browser allows it) once it's mostly in view, and pauses
 * again once it scrolls off-screen.
 */
export function VideoReel() {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full">
      <div
        className="w-full rounded-sm overflow-hidden border border-line bg-black/80 shadow-md"
        style={{ aspectRatio: `${FEATURED.width} / ${FEATURED.height}` }}
      >
        {FEATURED.platform === "local" ? (
          <video
            ref={videoRef}
            src={FEATURED.url}
            muted
            loop
            playsInline
            controls
            preload="metadata"
            className="w-full h-full object-cover"
          />
        ) : (
          <iframe
            src={FEATURED.url}
            className="w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            title={t(FEATURED.title.en, FEATURED.title.bn)}
          />
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <p className="text-xs text-muted truncate">{t(FEATURED.title.en, FEATURED.title.bn)}</p>
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
