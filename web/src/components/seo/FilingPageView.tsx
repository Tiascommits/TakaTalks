import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { FILING_PAGES, SOURCES, findPage, pagePath, type Lang } from "@/lib/seo/filing-pages";

// Shared by /bn/[slug] and /en/[slug]: static pages, one per FILING_PAGES entry and language.
export const staticParams = (lang: Lang) => FILING_PAGES.map((p) => ({ slug: p[lang].slug }));

export function filingMetadata(lang: Lang, slug: string): Metadata {
  const page = findPage(lang, slug);
  if (!page) return {};
  // title and description only: a page-level openGraph would drop the site's share image (AGENTS.md).
  return {
    title: page[lang].title,
    description: page[lang].description,
    alternates: { canonical: pagePath(lang, page), languages: { bn: pagePath("bn", page), en: pagePath("en", page) } },
  };
}

export function FilingPageView({ lang, slug }: { lang: Lang; slug: string }) {
  const page = findPage(lang, slug);
  if (!page) notFound();
  const c = page[lang];
  const other: Lang = lang === "bn" ? "en" : "bn";
  const L = (en: string, bn: string) => (lang === "bn" ? bn : en);
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <main lang={lang}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }} // safe-html: JSON-LD from constant copy + TAX_RULES, "<" escaped
      />
      <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
        <div className="max-w-[1160px] mx-auto">
          <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-2">{c.h1}</h1>
          {c.intro.map((p) => (
            <p key={p} className="max-w-[700px] text-sm text-[#DCE6DD] mb-1">{p}</p>
          ))}
        </div>
      </header>
      <section className="max-w-[1160px] mx-auto px-5 mt-5 text-sm">
        <ul className="list-disc pl-5 space-y-1">
          {c.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p className="mt-3">
          <Link href={pagePath(other, page)} hrefLang={other} className="underline text-green-deep">
            {L("পড়ুন বাংলায়", "Read in English")}
          </Link>
        </p>
      </section>
      <section className="max-w-[1160px] mx-auto px-5 mt-6">
        <h2 className="font-serif font-semibold text-xl">{L("Estimate your own tax", "নিজের কর হিসাব করুন")}</h2>
      </section>
      <CalculatorForm initial={page.prefill} />
      <section className="max-w-[1160px] mx-auto px-5 mb-6 text-sm">
        <h2 className="font-serif font-semibold text-xl mb-2">{L("Questions", "প্রশ্ন ও উত্তর")}</h2>
        {c.faq.map((f) => (
          <div key={f.q} className="mb-3">
            <h3 className="font-semibold">{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>
      <section className="max-w-[1160px] mx-auto px-5 mb-12 text-xs text-muted">
        <h2 className="font-semibold text-sm mb-1">{L("Sources", "সূত্র")}</h2>
        <ul className="list-disc pl-5">
          {page.sources.map((k) => (
            <li key={k}>
              <a href={SOURCES[k].url} target="_blank" rel="noopener noreferrer" className="underline">{SOURCES[k].label}</a>
            </li>
          ))}
        </ul>
        <p className="mt-2">
          {L(
            "An estimate, not tax advice or an NBR service. Figures checked against the sources above; see the full rules on the calculator.",
            "এটি একটি আনুমানিক হিসাব, কর পরামর্শ বা NBR-এর সেবা নয়। সংখ্যাগুলো ওপরের সূত্রের সাথে মিলিয়ে দেখা।"
          )}
        </p>
      </section>
    </main>
  );
}
