import { digits, fmtTaka } from "@/lib/viz/math";
import { DISTRICTS, DIVISION_COLORS } from "@/lib/viz/districts";
import { fillRound, text, type VizDef } from "../engine";
import { goal, goalFields, goalStats, str } from "./common";

export const districtChallenge: VizDef = {
  slug: "district_challenge",
  fields: goalFields({ en: "What are you saving for?", bn: "কীসের জন্য জমাচ্ছেন?" }),
  defaults: { name: "", price: 640_000, saved: 180_000, monthly: 15_000 },
  header(s, lang) {
    const conquered = Math.floor(goal(s).pct * 64);
    return {
      eyebrow: lang === "en" ? "64-district savings challenge" : "৬৪ জেলা সঞ্চয় চ্যালেঞ্জ",
      title: str(s, "name") || (lang === "en" ? "Conquering Bangladesh" : "টাকায় টাকায় বাংলাদেশ জয়"),
      subtitle:
        lang === "en"
          ? `${conquered} of 64 districts conquered`
          : `৬৪টির মধ্যে ${digits(String(conquered), "bn")}টি জেলা জয় করেছি`,
    };
  },
  draw(p, s) {
    const { ctx, stage, theme, lang, t } = p;
    const g = goal(s);
    const conquered = Math.floor(g.pct * 64);
    const gap = 8;
    const tw = (stage.w - gap * 7) / 8;
    const th = Math.min(tw * 0.68, (stage.h - 240 - gap * 7) / 8);
    const gridH = th * 8 + gap * 7;
    const contentH = gridH + 60 + 40 + 140;
    const y0 = stage.y + Math.max(0, (stage.h - contentH) / 2);

    DISTRICTS.forEach((d, i) => {
      const x = stage.x + (i % 8) * (tw + gap);
      const y = y0 + Math.floor(i / 8) * (th + gap);
      const won = i < conquered;
      fillRound(ctx, { x, y, w: tw, h: th }, 8, won ? DIVISION_COLORS[d.division] : theme.empty);
      text(ctx, digits(String(i + 1), lang), x + 8, y + 18, {
        size: 14,
        weight: 500,
        family: "mono",
        color: won ? "#ffffff" : theme.muted,
        alpha: 0.75,
      });
      if (won) text(ctx, "★", x + tw - 8, y + 19, { size: 16, color: "#ffe28a", align: "right" });
      text(ctx, lang === "en" ? d.en : d.bn, x + tw / 2, y + th * 0.7, {
        size: 19,
        weight: 600,
        color: won ? "#ffffff" : theme.muted,
        align: "center",
        maxW: tw - 10,
      });
    });

    let y = y0 + gridH + 50;
    const per = g.price / 64;
    const next = DISTRICTS[conquered];
    const line = next
      ? t(
          `Next up: ${next.en} — at ${fmtTaka(per * (conquered + 1), "en")}  ·  1 district = ${fmtTaka(per, "en")}`,
          `পরের জেলা: ${next.bn} — ${fmtTaka(per * (conquered + 1), "bn")} হলে  ·  ১ জেলা = ${fmtTaka(per, "bn")}`
        )
      : t("All 64 conquered! Bangladesh is yours 🇧🇩", "৬৪ জেলাই জয়! পুরো বাংলাদেশ আপনার 🇧🇩");
    text(ctx, line, stage.x + stage.w / 2, y, { size: 26, weight: 600, color: theme.ink, align: "center", maxW: stage.w });
    y += 30;
    goalStats(p, { x: stage.x, y: y + 10, w: stage.w, h: 140 }, g);
  },
};
