import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VIZ_LIST, getVizMeta } from "@/lib/viz/registry";
import { VizStudio } from "@/components/viz/VizStudio";

type VizPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return VIZ_LIST.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: VizPageProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = getVizMeta(slug);
  if (!meta) return {};
  return {
    title: `${meta.title.bn} · ${meta.title.en} — TakaTalks`,
    description: `${meta.hook.bn} ${meta.hook.en}`,
    openGraph: {
      title: `${meta.icon} ${meta.title.bn} — TakaTalks`,
      description: meta.hook.bn,
    },
  };
}

export default async function VizPage({ params, searchParams }: VizPageProps) {
  const { slug } = await params;
  if (!getVizMeta(slug)) notFound();
  const raw = await searchParams;
  // Poster state lives in the query string so a shared link reproduces the poster.
  const initial: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(raw)) initial[k] = Array.isArray(v) ? v[0] : v;
  return <VizStudio slug={slug} initial={initial} />;
}
