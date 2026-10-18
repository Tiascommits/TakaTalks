import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { VIZ_LIST } from "@/lib/viz/registry";
import { hasRateData } from "@/lib/rates/current-rates";

// Re-checked hourly so /rates joins the sitemap once a scrape stores a rate.
export const revalidate = 3600;

const PAGES = [
  "", "/calculator", "/tax_basic_calculation", "/salary", "/freelance", "/zakat", "/loans",
  "/instruments", "/reinvest", "/goals", "/habits", "/freedom", "/cars", "/tracker", "/videos",
  "/viz", "/privacy", "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = [...PAGES, ...VIZ_LIST.map((v) => `/viz/${v.slug}`)];
  if (await hasRateData()) paths.push("/rates");
  return paths.map((p) => ({ url: `${SITE_URL}${p}` }));
}
