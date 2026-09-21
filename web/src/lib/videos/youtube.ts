export type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
};

type PlaylistThumbnail = { url: string };

type PlaylistItem = {
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    resourceId: { videoId: string };
    thumbnails?: {
      maxres?: PlaylistThumbnail;
      high?: PlaylistThumbnail;
      default?: PlaylistThumbnail;
    };
  };
};

export async function getLatestYouTubeVideos(maxResults = 6): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey || !channelId) {
    console.error('YouTube API keys are missing in .env');
    return [];
  }

  // The "Uploads" playlist ID is just the Channel ID with 'UU' instead of 'UC'
  const uploadsPlaylistId = channelId.replace(/^UC/, 'UU');

  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${apiKey}`;

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Failed to fetch YouTube videos', text);
      return [];
    }

    const data: { items: PlaylistItem[] } = await response.json();

    return data.items.flatMap((item) => {
      const { thumbnails } = item.snippet;
      const thumbnailUrl = thumbnails?.maxres?.url || thumbnails?.high?.url || thumbnails?.default?.url;
      // Private and deleted videos come back without thumbnails; leave them out of the feed.
      if (!thumbnailUrl) return [];
      return [{
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl,
        publishedAt: item.snippet.publishedAt,
      }];
    });
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
    return [];
  }
}
