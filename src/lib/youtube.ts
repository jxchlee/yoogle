import {
  createSamplePlaylistEntries,
  createSampleSearchResponse,
} from "@/lib/sample-data";
import type { PlaylistEntry, SearchResponse, SearchResult } from "@/lib/types";

type SearchArgs = {
  query: string;
  pageToken?: string;
  regionCode: string;
};

type SearchItemResponse = {
  id?: {
    videoId?: string;
    playlistId?: string;
  };
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
};

type VideosResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      description?: string;
      channelTitle?: string;
      publishedAt?: string;
    };
    contentDetails?: {
      duration?: string;
    };
    statistics?: {
      viewCount?: string;
    };
  }>;
};

type PlaylistsResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      description?: string;
      channelTitle?: string;
      publishedAt?: string;
    };
    contentDetails?: {
      itemCount?: number;
    };
  }>;
};

type PlaylistItemsResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      channelTitle?: string;
      position?: number;
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
      resourceId?: {
        videoId?: string;
      };
    };
  }>;
};

function formatViewCount(viewCount?: string) {
  if (!viewCount) {
    return undefined;
  }

  const numericValue = Number(viewCount);

  if (Number.isNaN(numericValue)) {
    return undefined;
  }

  return `${new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(numericValue)} views`;
}

function formatPublishedLabel(publishedAt?: string) {
  if (!publishedAt) {
    return "recently";
  }

  const timestamp = new Date(publishedAt).getTime();

  if (Number.isNaN(timestamp)) {
    return "recently";
  }

  const diff = Date.now() - timestamp;
  const day = 86_400_000;

  if (diff < day) {
    return "today";
  }

  if (diff < day * 30) {
    return `${Math.floor(diff / day)}d ago`;
  }

  if (diff < day * 365) {
    return `${Math.floor(diff / (day * 30))}mo ago`;
  }

  return `${Math.floor(diff / (day * 365))}y ago`;
}

function parseDuration(duration?: string) {
  if (!duration) {
    return "unknown";
  }

  const match = duration.match(
    /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/,
  );

  if (!match) {
    return duration;
  }

  const [, days, hours, minutes, seconds] = match;
  const totalHours = Number(hours ?? 0) + Number(days ?? 0) * 24;
  const totalMinutes = Number(minutes ?? 0);
  const totalSeconds = Number(seconds ?? 0);
  const pieces = [totalHours, totalMinutes, totalSeconds]
    .filter((piece, index) => piece > 0 || index > 0)
    .map((piece) => piece.toString().padStart(2, "0"));

  return pieces.length > 0 ? pieces.join(":") : "0:00";
}

async function fetchJson<T>(url: URL) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `YouTube API error (${response.status}): ${errorText || response.statusText}`,
    );
  }

  return (await response.json()) as T;
}

export async function searchYouTube({
  query,
  pageToken,
  regionCode,
}: SearchArgs): Promise<SearchResponse> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return createSampleSearchResponse(query, pageToken);
  }

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("type", "video,playlist");
  searchUrl.searchParams.set("maxResults", "8");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("regionCode", regionCode);
  searchUrl.searchParams.set("key", apiKey);

  if (pageToken) {
    searchUrl.searchParams.set("pageToken", pageToken);
  }

  const searchResponse = await fetchJson<{
    items?: SearchItemResponse[];
    nextPageToken?: string;
  }>(searchUrl);

  const videoIds = (searchResponse.items ?? [])
    .map((item) => item.id?.videoId)
    .filter((id): id is string => Boolean(id));

  const playlistIds = (searchResponse.items ?? [])
    .map((item) => item.id?.playlistId)
    .filter((id): id is string => Boolean(id));

  if (videoIds.length === 0 && playlistIds.length === 0) {
    return {
      items: [],
      nextPageToken: null,
      source: "youtube",
    };
  }

  const videoMap = new Map<
    string,
    NonNullable<VideosResponse["items"]>[number]
  >();

  if (videoIds.length > 0) {
    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.searchParams.set("part", "snippet,contentDetails,statistics");
    videosUrl.searchParams.set("id", videoIds.join(","));
    videosUrl.searchParams.set("key", apiKey);

    const videosResponse = await fetchJson<VideosResponse>(videosUrl);

    for (const item of videosResponse.items ?? []) {
      if (item.id) {
        videoMap.set(item.id, item);
      }
    }
  }

  const playlistMap = new Map<
    string,
    NonNullable<PlaylistsResponse["items"]>[number]
  >();

  if (playlistIds.length > 0) {
    const playlistsUrl = new URL("https://www.googleapis.com/youtube/v3/playlists");
    playlistsUrl.searchParams.set("part", "snippet,contentDetails");
    playlistsUrl.searchParams.set("id", playlistIds.join(","));
    playlistsUrl.searchParams.set("key", apiKey);

    const playlistsResponse = await fetchJson<PlaylistsResponse>(playlistsUrl);

    for (const item of playlistsResponse.items ?? []) {
      if (item.id) {
        playlistMap.set(item.id, item);
      }
    }
  }

  const items = (searchResponse.items ?? [])
    .map((item): SearchResult | null => {
      const videoId = item.id?.videoId;
      const playlistId = item.id?.playlistId;

      if (!item.snippet || (!videoId && !playlistId)) {
        return null;
      }

      if (playlistId) {
        const playlist = playlistMap.get(playlistId);
        const snippet = playlist?.snippet ?? item.snippet;
        const thumbnailUrl =
          item.snippet.thumbnails?.high?.url ??
          item.snippet.thumbnails?.medium?.url ??
          item.snippet.thumbnails?.default?.url ??
          "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg";

        return {
          id: playlistId,
          resourceType: "playlist",
          title: snippet.title ?? "Untitled playlist",
          channelTitle: snippet.channelTitle ?? "Unknown channel",
          description: snippet.description ?? "",
          thumbnailUrl,
          publishedAt: snippet.publishedAt ?? new Date().toISOString(),
          publishedLabel: formatPublishedLabel(snippet.publishedAt),
          playlistItemCount: playlist?.contentDetails?.itemCount,
        };
      }

      const details = videoMap.get(videoId!);
      const detailSnippet = details?.snippet;
      const thumbnailUrl =
        item.snippet.thumbnails?.high?.url ??
        item.snippet.thumbnails?.medium?.url ??
        item.snippet.thumbnails?.default?.url ??
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      return {
        id: videoId!,
        resourceType: "video",
        title: detailSnippet?.title ?? item.snippet.title ?? "Untitled video",
        channelTitle:
          detailSnippet?.channelTitle ?? item.snippet.channelTitle ?? "Unknown channel",
        description: detailSnippet?.description ?? item.snippet.description ?? "",
        thumbnailUrl,
        publishedAt:
          detailSnippet?.publishedAt ?? item.snippet.publishedAt ?? new Date().toISOString(),
        publishedLabel: formatPublishedLabel(
          detailSnippet?.publishedAt ?? item.snippet.publishedAt,
        ),
        duration: parseDuration(details?.contentDetails?.duration),
        viewCount: formatViewCount(details?.statistics?.viewCount),
      };
    })
    .filter((item): item is SearchResult => Boolean(item));

  return {
    items,
    nextPageToken: searchResponse.nextPageToken ?? null,
    source: "youtube",
  };
}

export async function fetchPlaylistEntries(
  playlistId: string,
): Promise<PlaylistEntry[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return createSamplePlaylistEntries(playlistId);
  }

  const playlistItemsUrl = new URL(
    "https://www.googleapis.com/youtube/v3/playlistItems",
  );
  playlistItemsUrl.searchParams.set("part", "snippet");
  playlistItemsUrl.searchParams.set("playlistId", playlistId);
  playlistItemsUrl.searchParams.set("maxResults", "25");
  playlistItemsUrl.searchParams.set("key", apiKey);

  const response = await fetchJson<PlaylistItemsResponse>(playlistItemsUrl);

  return (response.items ?? [])
    .map((item): PlaylistEntry | null => {
      const snippet = item.snippet;
      const videoId = snippet?.resourceId?.videoId;

      if (!snippet || !videoId) {
        return null;
      }

      const thumbnailUrl =
        snippet.thumbnails?.high?.url ??
        snippet.thumbnails?.medium?.url ??
        snippet.thumbnails?.default?.url ??
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      return {
        id: item.id ?? `${playlistId}-${snippet.position ?? 0}`,
        videoId,
        title: snippet.title ?? "Untitled playlist item",
        channelTitle: snippet.channelTitle ?? "Unknown channel",
        thumbnailUrl,
        position: snippet.position ?? 0,
      };
    })
    .filter((item): item is PlaylistEntry => Boolean(item));
}
