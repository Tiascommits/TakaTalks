import type { Metadata } from "next";
import { Newsreader, Noto_Sans_Bengali, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Analytics } from "@/components/Analytics";
import { RatesLiveProvider } from "@/components/rates/RatesLive";
import { hasRateData } from "@/lib/rates/current-rates";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.takatalks.com"),
  title: "TakaTalks — আয়কর ও বিনিয়োগ ট্র্যাকার",
  description:
    "Personal finance tools for a Bangladesh audience: tax calculator, rebate optimizer, and income/investment tracker.",
  // No title or description here: Next copies each page's own into the og: and
  // twitter: tags, and the image comes from app/opengraph-image.tsx. A page
  // that sets its own `openGraph` replaces this whole object, image included.
  openGraph: { siteName: "TakaTalks", type: "website" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const ratesLive = await hasRateData();
  return (
    <html
      lang="bn"
      className={`${newsreader.variable} ${notoBengali.variable} ${plexMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <LanguageProvider>
          <RatesLiveProvider value={ratesLive}>
            <SiteNav />
            <div className="flex-1 flex flex-col">{children}</div>
            <SiteFooter />
          </RatesLiveProvider>
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
