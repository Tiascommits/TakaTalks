export function buildFacebookEmbedUrl(videoUrl: string): string {
  const encoded = encodeURIComponent(videoUrl);
  return `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false`;
}

export function buildYoutubeEmbedUrl(videoUrl: string): string {
  const url = new URL(videoUrl);
  let videoId: string | null = null;

  if (url.hostname.includes("youtu.be")) {
    videoId = url.pathname.slice(1);
  } else if (url.pathname.startsWith("/shorts/")) {
    videoId = url.pathname.replace("/shorts/", "");
  } else {
    videoId = url.searchParams.get("v");
  }

  if (!videoId) {
    throw new Error(`Could not extract a YouTube video ID from: ${videoUrl}`);
  }

  return `https://www.youtube.com/embed/${videoId}`;
}

export function buildEmbedUrl(platform: "facebook" | "youtube", videoUrl: string): string {
  return platform === "facebook" ? buildFacebookEmbedUrl(videoUrl) : buildYoutubeEmbedUrl(videoUrl);
}
