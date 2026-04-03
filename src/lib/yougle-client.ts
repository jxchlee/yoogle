import type { SearchResult, StoredSettings, WatchHistoryItem } from "@/lib/types";

export const SEARCH_HISTORY_KEY = "yougle:search-history";
export const WATCH_HISTORY_KEY = "yougle:watch-history";
export const SETTINGS_KEY = "yougle:settings";

export const DEFAULT_SETTINGS: StoredSettings = {
  searchHistoryEnabled: true,
  watchHistoryEnabled: true,
  regionCode: "KR",
};

export function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStore<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function saveSearch(history: string[], query: string) {
  return Array.from(new Set([query, ...history])).slice(0, 8);
}

export function saveWatch(history: WatchHistoryItem[], video: SearchResult) {
  const nextItem: WatchHistoryItem = {
    id: video.id,
    title: video.title,
    channelTitle: video.channelTitle,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    publishedAt: video.publishedAt,
    publishedLabel: video.publishedLabel,
    duration: video.duration,
    viewCount: video.viewCount,
    watchedAt: new Date().toISOString(),
  };

  return [nextItem, ...history.filter((item) => item.id !== video.id)].slice(0, 12);
}

export function suggestionsFor(input: string, searchHistory: string[]) {
  const normalized = input.trim().toLowerCase();
  return searchHistory
    .filter((item) => item.toLowerCase().includes(normalized))
    .slice(0, 7);
}

export function timeAgo(input: string) {
  const date = new Date(input).getTime();

  if (Number.isNaN(date)) {
    return "just now";
  }

  const diff = Date.now() - date;
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  if (diff < hour) {
    return `${Math.max(1, Math.floor(diff / (60 * 1000)))} minutes ago`;
  }

  if (diff < day) {
    return `${Math.floor(diff / hour)} hours ago`;
  }

  return `${Math.floor(diff / day)} days ago`;
}

export function watchHistoryToResult(item: WatchHistoryItem): SearchResult {
  return {
    id: item.id,
    title: item.title,
    channelTitle: item.channelTitle,
    description: item.description ?? "Opened from your yougle watch history.",
    thumbnailUrl: item.thumbnailUrl,
    publishedAt: item.publishedAt ?? item.watchedAt,
    publishedLabel: item.publishedLabel ?? "From your history",
    duration: item.duration ?? "Saved",
    viewCount: item.viewCount,
  };
}
