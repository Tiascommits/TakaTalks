import { VideosHeader } from "@/components/videos/VideosHeader";
import { VideosContent } from "@/components/videos/VideosContent";

export const metadata = {
  title: "ভিডিও — TakaTalks",
  description: "Shortform and longform TakaTalks money videos, watch a video and run your own numbers next to it.",
};

export default function VideosPage() {
  return (
    <>
      <VideosHeader />
      <VideosContent />
    </>
  );
}
