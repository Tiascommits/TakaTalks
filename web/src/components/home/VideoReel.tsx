"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { VIDEOS } from "@/config/videos";

// The homepage only ever features one clip, so pick the landscape one —
// a portrait short would letterbox badly at full page width.
const FEATURED = VIDEOS.find((v) => v.width > v.height) ?? VIDEOS[0];

/**
 * Full-width featured video. Autoplays (muted, so the browser allows it)
 * once it's mostly in view, and pauses again once it scrolls off-screen.
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
    <section className="bg-green-deep text-paper py-8 sm:py-12">
      <div className="max-w-[1160px] mx-auto px-5">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <p className="font-mono text-[10px] tracking-wider text-gold mb-1.5">
              {t("WATCH", "দেখুন")}
            </p>
            <h2 className="font-serif font-bold text-xl sm:text-2xl leading-tight">
              {t("Watch the video, then run your own numbers", "ভিডিও দেখুন, তারপর নিজের হিসাব করুন")}
            </h2>
          </div>

          <Link
            href="/videos"
            className="hidden sm:block shrink-0 font-mono text-[10px] tracking-wider text-gold hover:underline"
          >
            {t("SEE ALL VIDEOS →", "সব ভিডিও →")}
          </Link>
        </div>

        <div
          className="w-full rounded-sm overflow-hidden border border-paper/15 bg-black/20"
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

        <div className="mt-4">
          <h3 className="font-serif font-semibold text-sm">
            {t(FEATURED.title.en, FEATURED.title.bn)}
          </h3>
          <p className="text-xs text-paper/70 leading-relaxed mt-0.5">
            {t(FEATURED.description.en, FEATURED.description.bn)}
          </p>
        </div>

        <Link
          href="/videos"
          className="sm:hidden mt-4 block text-center font-mono text-[10px] tracking-wider text-gold hover:underline"
        >
          {t("SEE ALL VIDEOS →", "সব ভিডিও →")}
        </Link>
      </div>
    </section>
  );
}
