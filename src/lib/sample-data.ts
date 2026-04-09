import type { PlaylistEntry, SearchResponse, SearchResult } from "@/lib/types";

const SAMPLE_RESULTS = [
  {
    id: "jfKfPfyJRdk",
    resourceType: "video" as const,
    title: "lofi hip hop radio - beats to relax/study to",
    channelTitle: "Lofi Girl",
    description:
      "A dependable study stream used here as sample YouTube data. This sample description is intentionally a bit longer so the watch page can show a fuller text block instead of a very short preview.",
    duration: "LIVE",
    viewCount: "13M views",
  },
  {
    id: "PLrAXtmRdnEQy6nuLMHjMZOz59f4vHh3QG",
    resourceType: "playlist" as const,
    title: "One Punch Man Full Openings and Themes",
    channelTitle: "Anime Playlist Archive",
    description:
      "A sample playlist result to test playlist rendering and watch-page playlist embedding.",
    playlistItemCount: 18,
  },
  {
    id: "ysz5S6PUM-U",
    resourceType: "video" as const,
    title: "YouTube Developers Live: Search API walkthrough",
    channelTitle: "Google for Developers",
    description:
      "Useful sample content for a search-focused product MVP. This item acts like a fuller description payload that would normally come from the video details endpoint.",
    duration: "12:29",
    viewCount: "95K views",
  },
  {
    id: "PLjq6DwYksrzxsfMkXHOU0sN6RVemYByW_",
    resourceType: "playlist" as const,
    title: "Focused coding music playlist",
    channelTitle: "Momentum FM",
    description:
      "Sample playlist content for a playlist-style search result row.",
    playlistItemCount: 27,
  },
  {
    id: "aqz-KE-bpKQ",
    resourceType: "video" as const,
    title: "Big Buck Bunny in 4K",
    channelTitle: "Blender Foundation",
    description:
      "Public sample video often used for playback testing. It helps validate the larger internal watch page layout.",
    duration: "9:56",
    viewCount: "32M views",
  },
  {
    id: "ScMzIvxBSi4",
    resourceType: "video" as const,
    title: "Calm coding playlist for deep work",
    channelTitle: "Focus Lab",
    description:
      "Placeholder description for a focused work session with more copy so the watch page looks closer to a real viewing screen.",
    duration: "1:02:10",
    viewCount: "1.2M views",
  },
  {
    id: "M7lc1UVf-VE",
    resourceType: "video" as const,
    title: "YouTube IFrame Player API Demo",
    channelTitle: "YouTube Developers",
    description:
      "Official player API demo used here as a relevant example for embedding and playback behavior.",
    duration: "4:35",
    viewCount: "418K views",
  },
  {
    id: "3fumBcKC6RE",
    resourceType: "video" as const,
    title: "Frontend architecture in one sitting",
    channelTitle: "System Design Notes",
    description:
      "Another sample result to make the MVP feel populated and to test longer metadata on the watch page.",
    duration: "18:44",
    viewCount: "284K views",
  },
  {
    id: "5qap5aO4i9A",
    resourceType: "video" as const,
    title: "Deep focus radio for late-night shipping",
    channelTitle: "Lofi Girl",
    description:
      "Ambient sample content that fits the product mood and gives the internal viewer more realistic text to show.",
    duration: "LIVE",
    viewCount: "9.4M views",
  },
  {
    id: "9bZkp7q19f0",
    resourceType: "video" as const,
    title: "High-energy search result sample",
    channelTitle: "Sample Channel",
    description:
      "A bright placeholder result for layout and card testing, also useful for larger thumbnails and metadata blocks.",
    duration: "4:13",
    viewCount: "5.1M views",
  },
  {
    id: "dQw4w9WgXcQ",
    resourceType: "video" as const,
    title: "Unexpected but reliable MVP test video",
    channelTitle: "Demo Archive",
    description:
      "Useful when you need a stable embeddable sample video while iterating on the internal watch flow.",
    duration: "3:33",
    viewCount: "1.6B views",
  },
  {
    id: "FTQbiNvZqaY",
    resourceType: "video" as const,
    title: "Product thinking and launch rituals",
    channelTitle: "Maker Notes",
    description:
      "A sample result meant to stand in for creator content and simulate a richer detail page description.",
    duration: "14:18",
    viewCount: "72K views",
  },
  {
    id: "60ItHLz5WEA",
    resourceType: "video" as const,
    title: "Playlist for building the first version",
    channelTitle: "Momentum FM",
    description:
      "Sample media to show long-form cards and watch history across the search and watch experience.",
    duration: "3:27",
    viewCount: "2.4B views",
  },
  {
    id: "2Vv-BfVoq4g",
    resourceType: "video" as const,
    title: "Design polish for product MVPs",
    channelTitle: "Interface Journal",
    description:
      "A final sample item for second-page infinite scrolling and fuller watch-page descriptions.",
    duration: "4:41",
    viewCount: "6.5B views",
  },
];

function thumbnailUrl(id: string, resourceType: "video" | "playlist") {
  if (resourceType === "playlist") {
    return "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg";
  }

  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function createSampleSearchResponse(
  query: string,
  pageToken?: string,
): SearchResponse {
  const normalizedQuery = query.trim();
  const pageIndex = pageToken === "page-2" ? 1 : 0;
  const items = SAMPLE_RESULTS.slice(pageIndex * 6, pageIndex * 6 + 6).map(
    (item, index): SearchResult => ({
      id: item.id,
      resourceType: item.resourceType,
      title: `${item.title} - ${normalizedQuery}`,
      channelTitle: item.channelTitle,
      description: item.description,
      thumbnailUrl: thumbnailUrl(item.id, item.resourceType),
      publishedAt: new Date(
        Date.now() - (index + pageIndex * 6) * 86_400_000,
      ).toISOString(),
      publishedLabel: `${index + 1 + pageIndex * 6}d ago`,
      duration: item.duration,
      playlistItemCount: item.playlistItemCount,
      viewCount: item.viewCount,
    }),
  );

  return {
    items,
    nextPageToken: pageIndex === 0 ? "page-2" : null,
    source: "sample",
  };
}

export function createSamplePlaylistEntries(playlistId: string): PlaylistEntry[] {
  return Array.from({ length: 8 }).map((_, index) => ({
    id: `${playlistId}-${index + 1}`,
    videoId: SAMPLE_RESULTS[index % SAMPLE_RESULTS.length]?.id ?? "jfKfPfyJRdk",
    title: `Sample playlist item ${index + 1}`,
    channelTitle: "Anime Playlist Archive",
    thumbnailUrl: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
    position: index,
  }));
}
