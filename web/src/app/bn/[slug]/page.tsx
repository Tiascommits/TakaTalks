import { FilingPageView, filingMetadata, staticParams } from "@/components/seo/FilingPageView";

export const dynamicParams = false;
export const generateStaticParams = () => staticParams("bn");

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return filingMetadata("bn", (await params).slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <FilingPageView lang="bn" slug={(await params).slug} />;
}
