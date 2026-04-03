export type SearchResult = {
  id: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  publishedLabel: string;
  duration: string;
  viewCount?: string;
};

export type SearchResponse = {
  items: SearchResult[];
  nextPageToken: string | null;
  source: "sample" | "youtube";
};

export type StoredSettings = {
  searchHistoryEnabled: boolean;
  watchHistoryEnabled: boolean;
  regionCode: string;
};

export type WatchHistoryItem = {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  watchedAt: string;
};
