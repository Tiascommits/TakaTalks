import { getLatestYouTubeVideos } from "@/lib/videos/youtube";

export async function YouTubeFeed() {
  const videos = await getLatestYouTubeVideos(6);

  if (videos.length === 0) {
    return null;
  }

  // To support bilingual headers inside a Server Component we can pass translations
  // but since useLanguage is client side, let's just make this a Server Component wrapper
  // Or we can just render the grid here directly.
  return (
    <section>
      <div className="mb-5">
        <h2 className="font-serif font-bold text-xl text-green-deep">
          Latest on YouTube
        </h2>
        <p className="text-xs text-muted mt-1">
          Automatically synced from our YouTube channel.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {videos.map((video) => (
          <a
            key={video.id}
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col bg-paper rounded-xs overflow-hidden border border-line shadow-xs hover:shadow-sm transition-all"
          >
            <div className="aspect-video relative overflow-hidden bg-black/5">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                <div className="w-10 h-10 bg-[#FF0000] text-white flex items-center justify-center rounded-full shadow-lg">
                  <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-serif font-semibold text-sm text-green-deep line-clamp-2">
                {video.title}
              </h3>
              <p className="text-xs text-muted mt-1.5 flex-1 line-clamp-2">
                {video.description}
              </p>
              <p className="text-[10px] text-muted/70 mt-3 font-mono tracking-wider">
                {new Date(video.publishedAt).toLocaleDateString()}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
