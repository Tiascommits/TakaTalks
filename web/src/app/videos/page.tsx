import { VideosHeader } from "@/components/videos/VideosHeader";
import { VideosContent } from "@/components/videos/VideosContent";
import { YouTubeFeed } from "@/components/videos/YouTubeFeed";

export const metadata = {
  title: "ভিডিও — TakaTalks",
  description: "Shortform and longform TakaTalks money videos, watch a video and run your own numbers next to it.",
};

export default function VideosPage() {
  return (
    <>
      <VideosHeader />
      <VideosContent />
      <div className="max-w-[1160px] mx-auto px-5 pb-10 w-full">
        <YouTubeFeed />
      </div>
    </>
  );
}
