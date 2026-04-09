export type SearchResult = {
  id: string;
  resourceType: "video" | "playlist";
  title: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  publishedLabel: string;
  duration?: string;
  playlistItemCount?: number;
  viewCount?: string;
};

export type SearchResponse = {
  items: SearchResult[];
  nextPageToken: string | null;
  source: "sample" | "youtube";
};

export type PlaylistEntry = {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  position: number;
};

export type StoredSettings = {
  searchHistoryEnabled: boolean;
  watchHistoryEnabled: boolean;
  regionCode: string;
};

export type WatchHistoryItem = {
  id: string;
  resourceType?: "video" | "playlist";
  title: string;
  channelTitle: string;
  description?: string;
  thumbnailUrl: string;
  publishedAt?: string;
  publishedLabel?: string;
  duration?: string;
  playlistItemCount?: number;
  viewCount?: string;
  watchedAt: string;
};
