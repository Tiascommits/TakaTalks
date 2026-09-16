"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { buildEmbedUrl } from "@/lib/videos/embed";
import { VIDEOS } from "@/config/videos";

const ADVANCE_MS = 6000;

/**
 * Auto-advancing horizontal reel of the latest videos.
 *
 * Scroll-snap does the positioning, so manual swiping on a phone works
 * natively and the auto-advance is just a `scrollTo` on a timer. The timer
 * stops whenever advancing would fight the person using it: pointer over
 * the reel, keyboard focus inside it, an active touch, a backgrounded tab,
 * or `prefers-reduced-motion`. With fewer than two videos there is nothing
 * to advance to, so no timer is started and no controls are rendered.
 */
export function VideoReel() {
  const { t } = useLanguage();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const videos = VIDEOS;
  const canAdvance = videos.length > 1;

  const scrollToIndex = useCallback((next: number, smooth = true) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.children[next] as HTMLElement | undefined;
    if (!card) return;
    scroller.scrollTo({
      left: card.offsetLeft - scroller.offsetLeft,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  // Keep the dots in step with wherever the person has actually scrolled to.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let frame = 0;
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const children = Array.from(scroller!.children) as HTMLElement[];
        const left = scroller!.scrollLeft + scroller!.clientWidth / 2;
        let nearest = 0;
        let best = Infinity;
        children.forEach((child, i) => {
          const centre = child.offsetLeft - scroller!.offsetLeft + child.clientWidth / 2;
          const distance = Math.abs(centre - left);
          if (distance < best) {
            best = distance;
            nearest = i;
          }
        });
        setIndex(nearest);
      });
    }

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!canAdvance || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setIndex((current) => {
        const next = (current + 1) % videos.length;
        scrollToIndex(next);
        return next;
      });
    }, ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [canAdvance, paused, videos.length, scrollToIndex]);

  // A backgrounded tab shouldn't burn through the reel unwatched.
  useEffect(() => {
    function onVisibility() {
      setPaused(document.hidden);
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const step = (delta: number) => {
    const next = (index + delta + videos.length) % videos.length;
    setIndex(next);
    scrollToIndex(next);
  };

  return (
    <section className="bg-green-deep text-paper py-8 sm:py-12">
      <div className="max-w-[1160px] mx-auto px-5">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <p className="font-mono text-[10px] tracking-wider text-gold mb-1.5">
              {t("SHORTFORM + LONGFORM", "শর্টফর্ম + লংফর্ম")}
            </p>
            <h2 className="font-serif font-bold text-xl sm:text-2xl leading-tight">
              {t("Watch the video, then run your own numbers", "ভিডিও দেখুন, তারপর নিজের হিসাব করুন")}
            </h2>
          </div>

          {canAdvance && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={t("Previous video", "আগের ভিডিও")}
                className="w-9 h-9 border border-paper/30 rounded-sm hover:border-gold hover:text-gold transition-colors"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={t("Next video", "পরের ভিডিও")}
                className="w-9 h-9 border border-paper/30 rounded-sm hover:border-gold hover:text-gold transition-colors"
              >
                →
              </button>
            </div>
          )}
        </div>

        <div
          ref={scrollerRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-5 px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {videos.map((video) => (
            <article
              key={video.id}
              className="snap-start shrink-0 w-[78vw] max-w-[300px] sm:w-[260px] bg-black/20 border border-paper/15 rounded-sm overflow-hidden"
            >
              <div className={video.format === "short" ? "aspect-[9/16]" : "aspect-video"}>
                <iframe
                  src={buildEmbedUrl(video.platform, video.url)}
                  className="w-full h-full"
                  allow="encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  title={t(video.title.en, video.title.bn)}
                />
              </div>
              <div className="p-3.5">
                <h3 className="font-serif font-semibold text-sm mb-1">
                  {t(video.title.en, video.title.bn)}
                </h3>
                <p className="text-xs text-paper/70 leading-relaxed line-clamp-2">
                  {t(video.description.en, video.description.bn)}
                </p>
              </div>
            </article>
          ))}

          <Link
            href="/videos"
            className="snap-start shrink-0 w-[60vw] max-w-[220px] sm:w-[200px] border border-dashed border-paper/30 rounded-sm flex flex-col items-center justify-center gap-2 p-5 text-center hover:border-gold hover:text-gold transition-colors"
          >
            <span aria-hidden="true" className="text-2xl">
              ▶
            </span>
            <span className="font-serif font-semibold text-sm">
              {t("See all videos", "সব ভিডিও দেখুন")}
            </span>
            <span className="text-xs text-paper/60">
              {t("Shortform and longform, in one place", "শর্টফর্ম ও লংফর্ম, এক জায়গায়")}
            </span>
          </Link>
        </div>

        {canAdvance && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {videos.map((video, i) => (
              <button
                key={video.id}
                type="button"
                onClick={() => {
                  setIndex(i);
                  scrollToIndex(i);
                }}
                aria-label={t(`Go to video ${i + 1}`, `ভিডিও ${i + 1} দেখুন`)}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-gold" : "w-1.5 bg-paper/40 hover:bg-paper/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
