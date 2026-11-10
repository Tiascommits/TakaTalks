import { FilingPageView, filingMetadata, staticParams } from "@/components/seo/FilingPageView";

export const dynamicParams = false;
export const generateStaticParams = () => staticParams("en");

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return filingMetadata("en", (await params).slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <FilingPageView lang="en" slug={(await params).slug} />;
}
