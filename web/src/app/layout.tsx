import type { Metadata } from "next";
import { Newsreader, Noto_Sans_Bengali, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { SiteNav } from "@/components/SiteNav";

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
  title: "Takatox — আয়কর ও বিনিয়োগ ট্র্যাকার",
  description:
    "Personal finance tools for a Bangladesh audience: tax calculator, rebate optimizer, and income/investment tracker.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="bn"
      className={`${newsreader.variable} ${notoBengali.variable} ${plexMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <LanguageProvider>
          <SiteNav />
          <div className="flex-1 flex flex-col">{children}</div>
        </LanguageProvider>
      </body>
    </html>
  );
}
