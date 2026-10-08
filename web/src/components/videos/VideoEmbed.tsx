import { buildEmbedUrl } from "@/lib/videos/embed";
import type { VideoEntry } from "@/config/videos";

export function VideoEmbed({ video, title }: { video: VideoEntry; title: string }) {
  return (
    <iframe
      src={buildEmbedUrl(video.platform, video.url)}
      className="w-full h-full"
      allow="autoplay; encrypted-media; picture-in-picture; web-share"
      allowFullScreen
      loading="lazy"
      title={title}
    />
  );
}
