import type { Metadata } from "next";
import { VizHub } from "@/components/viz/VizHub";

export const metadata: Metadata = {
  title: "ভিজ্যুয়ালাইজার · Visualizers — TakaTalks",
  description:
    "Turn your savings goals into posters you can download, print and share — dream car loader, freedom ludo, 64-district challenge, matir bank and more.",
};

export default function VizIndexPage() {
  return <VizHub />;
}
