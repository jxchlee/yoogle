"use client";

import Image from "next/image";
import {
  Suspense,
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Logo, SearchForm, SiteFooter, TopBar } from "@/components/yougle-common";
import { HistorySheet, PrefsSheet } from "@/components/yougle-sheets";
import type { SearchResponse, SearchResult, WatchHistoryItem } from "@/lib/types";
import type { LogoTheme } from "@/lib/logo-theme";
import {
  getInitialSettings,
  getSearchCache,
  readStore,
  saveSearch,
  saveWatch,
  SEARCH_HISTORY_KEY,
  SETTINGS_KEY,
  setSearchCache,
  suggestionsFor,
  WATCH_HISTORY_KEY,
  watchHistoryToResult,
  writeStore,
} from "@/lib/yougle-client";

function YougleShell({ logoTheme }: { logoTheme: LogoTheme }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeQuery = searchParams.get("q")?.trim() ?? "";

  const [inputValue, setInputValue] = useState(activeQuery);
  const [settings, setSettings] = useState(getInitialSettings);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"sample" | "youtube" | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const deferredInput = useDeferredValue(inputValue);

  useEffect(() => {
    setInputValue(activeQuery);
  }, [activeQuery]);

  useEffect(() => {
    setSettings(getInitialSettings());
    setSearchHistory(readStore<string[]>(SEARCH_HISTORY_KEY, []));
    setWatchHistory(readStore<WatchHistoryItem[]>(WATCH_HISTORY_KEY, []));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      writeStore(SETTINGS_KEY, settings);
    }
  }, [settings]);

  const suggestions = useMemo(
    () => suggestionsFor(deferredInput, searchHistory),
    [deferredInput, searchHistory],
  );

  const setRootQuery = (query: string) => {
    startTransition(() => {
      const next = new URLSearchParams();

      if (query.trim()) {
        next.set("q", query.trim());
      }

      router.push(next.toString() ? `${pathname}?${next.toString()}` : pathname);
    });
  };

  const persistSearchHistory = (next: string[]) => {
    setSearchHistory(next);
    writeStore(SEARCH_HISTORY_KEY, next);
  };

  const persistWatchHistory = (next: WatchHistoryItem[]) => {
    setWatchHistory(next);
    writeStore(WATCH_HISTORY_KEY, next);
  };

  const runSearch = useEffectEvent(
    async (query: string, pageToken?: string, append = false) => {
      const trimmed = query.trim();

      if (!trimmed) {
        setResults([]);
        setNextPageToken(null);
        setError(null);
        setSource(null);
        return;
      }

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const cachedPayload = getSearchCache(
          trimmed,
          settings.regionCode,
          pageToken,
        );

        if (cachedPayload) {
          setSource(cachedPayload.source);
          setResults((previous) =>
            append ? [...previous, ...cachedPayload.items] : cachedPayload.items,
          );
          setNextPageToken(cachedPayload.nextPageToken);
          return;
        }

        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&regionCode=${settings.regionCode}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`,
          { cache: "no-store" },
        );

        const payload = (await response.json()) as SearchResponse | { error: string };

        if (!response.ok || !("items" in payload)) {
          throw new Error(
            "error" in payload ? payload.error : "Search could not be completed.",
          );
        }

        setSearchCache(trimmed, settings.regionCode, pageToken, payload);
        setSource(payload.source);
        setResults((previous) =>
          append ? [...previous, ...payload.items] : payload.items,
        );
        setNextPageToken(payload.nextPageToken);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Search could not be completed.",
        );
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
  );

  useEffect(() => {
    void runSearch(activeQuery, undefined, false);
  }, [activeQuery, settings.regionCode]);

  const loadMore = useEffectEvent(() => {
    if (!activeQuery || !nextPageToken || isLoading || isLoadingMore) {
      return;
    }

    void runSearch(activeQuery, nextPageToken, true);
  });

  useEffect(() => {
    if (!activeQuery) {
      return;
    }

    const target = sentinelRef.current;

    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "260px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [activeQuery, nextPageToken]);

  const submitSearch = (query: string) => {
    const trimmed = query.trim();
    setInputValue(trimmed);
    setHistoryOpen(false);
    setPrefsOpen(false);
    setRootQuery(trimmed);

    if (trimmed && settings.searchHistoryEnabled) {
      persistSearchHistory(saveSearch(searchHistory, trimmed));
    }
  };

  const openVideo = (video: SearchResult) => {
    if (settings.watchHistoryEnabled) {
      persistWatchHistory(saveWatch(watchHistory, video));
    }

    const next = new URLSearchParams();
    next.set(video.resourceType === "playlist" ? "playlist" : "video", video.id);

    if (activeQuery) {
      next.set("q", activeQuery);
    }

    startTransition(() => router.push(`/watch?${next.toString()}`));
  };

  const removeSearchItem = (query: string) => {
    persistSearchHistory(searchHistory.filter((item) => item !== query));
  };

  const removeWatchItem = (id: string) => {
    persistWatchHistory(watchHistory.filter((item) => item.id !== id));
  };

  const clearSearchItems = () => {
    if (!window.confirm("Delete all recent searches?")) {
      return;
    }

    persistSearchHistory([]);
  };

  const clearWatchItems = () => {
    if (!window.confirm("Delete all recently watched videos?")) {
      return;
    }

    persistWatchHistory([]);
  };

  const updateSettings = (next: typeof settings) => {
    setSettings(next);

    if (!next.searchHistoryEnabled) {
      persistSearchHistory([]);
    }

    if (!next.watchHistoryEnabled) {
      persistWatchHistory([]);
    }
  };

  const home = !activeQuery;
  const openResult = (result: SearchResult) => {
    openVideo(result);
  };

  return (
    <>
      {home ? (
        <div className="flex min-h-screen flex-col bg-white">
          <main className="relative flex flex-1 justify-center px-4 pt-[21vh] sm:pt-[18vh]">
            <TopBar
              showInfo
              absolute
              onOpenHistory={() => {
                setHistoryOpen((value) => !value);
                setPrefsOpen(false);
              }}
              onOpenPrefs={() => {
                setPrefsOpen((value) => !value);
                setHistoryOpen(false);
              }}
            />
            <div className="w-full max-w-[584px]">
              <div className="flex justify-center">
                <Logo theme={logoTheme} />
              </div>
              <div className="mt-8">
                <SearchForm
                  value={inputValue}
                  suggestions={suggestions}
                  onChange={setInputValue}
                  onSubmit={submitSearch}
                  onRemoveSuggestion={removeSearchItem}
                />
              </div>
            </div>
          </main>
          <SiteFooter />
        </div>
      ) : (
        <div className="flex min-h-screen flex-col bg-white">
          <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-white/95 backdrop-blur">
            <div className="mx-auto grid max-w-[1400px] grid-cols-[auto_minmax(0,720px)_auto] items-center gap-3 px-4 py-3 sm:px-6">
              <div className="justify-self-start">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="shrink-0 cursor-pointer"
                >
                  <Logo small theme={logoTheme} />
                </button>
              </div>
              <div className="w-full justify-self-center">
                <SearchForm
                  value={inputValue}
                  suggestions={suggestions}
                  compact
                  onChange={setInputValue}
                  onSubmit={submitSearch}
                  onRemoveSuggestion={removeSearchItem}
                />
              </div>
              <div className="flex items-center gap-2 justify-self-end">
                <button
                  type="button"
                  onClick={() => {
                    setHistoryOpen((value) => !value);
                    setPrefsOpen(false);
                  }}
                  className="cursor-pointer rounded-full bg-[#f2f2f2] px-4 py-2 text-sm text-[#202124]"
                >
                  History
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrefsOpen((value) => !value);
                    setHistoryOpen(false);
                  }}
                  aria-label="Preferences"
                  className="cursor-pointer rounded-full bg-[#f2f2f2] p-2.5 text-[#202124]"
                >
                  <span className="sr-only">Preferences</span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-[18px] w-[18px] fill-none stroke-current stroke-2"
                  >
                    <path d="M12 3l1.2 2.74L16 6.3l2.06-1.24 1.88 3.24L18 10.1l.08 2.8 1.86 1.84-1.88 3.24L16 16.74l-2.8.56L12 20l-1.2-2.7-2.8-.56-2.06 1.24-1.88-3.24L6 12.9l-.08-2.8L4.06 8.26l1.88-3.24L8 6.26l2.8-.52L12 3z" />
                    <circle cx="12" cy="12" r="2.8" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-12 pt-6 sm:px-6">
            <div className="mb-6 flex items-center gap-3 text-sm text-[#606060]">
              <span>
                Results for <span className="font-medium text-[#202124]">{activeQuery}</span>
              </span>
              {source === "sample" ? (
                <span className="rounded-full bg-[#fff8e1] px-3 py-1 text-xs text-[#8d6e63]">
                  Sample mode
                </span>
              ) : null}
            </div>

            {error ? (
              <div className="mb-6 rounded-2xl border border-[#f1c0c0] bg-[#fff6f6] px-4 py-4 text-sm text-[#c5221f]">
                {error}
              </div>
            ) : null}

            <div className="max-w-[960px] space-y-6">
              {results.map((result) => (
                <button
                  key={`${result.id}-${result.publishedAt}`}
                  type="button"
                  onClick={() => openResult(result)}
                  className="flex w-full cursor-pointer flex-col gap-3 text-left sm:flex-row"
                >
                  <div className="relative w-full overflow-hidden rounded-xl bg-[#0f0f0f] sm:w-[360px] sm:shrink-0">
                    <Image
                      src={result.thumbnailUrl}
                      alt={result.title}
                      width={720}
                      height={404}
                      className="aspect-video w-full object-cover"
                    />
                    {result.resourceType === "video" ? (
                      <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                        {result.duration}
                      </span>
                    ) : (
                      <div className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 text-xs font-medium text-white">
                        Playlist - {result.playlistItemCount ?? "?"} videos
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h2 className="line-clamp-2 text-[18px] font-normal leading-7 text-[#0f0f0f]">
                      {result.title}
                    </h2>
                    <p className="mt-1 text-xs text-[#606060]">
                      {result.resourceType === "playlist"
                        ? `Playlist - ${result.playlistItemCount ?? "?"} videos - ${result.publishedLabel}`
                        : `${result.viewCount ?? "Views hidden"} - ${result.publishedLabel}`}
                    </p>
                    <p className="mt-3 text-sm text-[#606060]">{result.channelTitle}</p>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#606060]">
                      {result.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="mt-8 text-sm text-[#606060]">Loading results...</div>
            ) : null}

            <div ref={sentinelRef} className="mt-8 h-8">
              {isLoadingMore ? (
                <div className="text-sm text-[#606060]">Loading more results...</div>
              ) : null}
            </div>
          </main>
          <SiteFooter />
        </div>
      )}

      <HistorySheet
        open={historyOpen}
        searchHistory={searchHistory}
        watchHistory={watchHistory}
        onClose={() => setHistoryOpen(false)}
        onSearchSelect={submitSearch}
        onWatchSelect={(item) => {
          setHistoryOpen(false);
          openVideo(watchHistoryToResult(item));
        }}
        onRemoveSearch={removeSearchItem}
        onRemoveWatch={removeWatchItem}
        onClearSearch={clearSearchItems}
        onClearWatch={clearWatchItems}
      />

      <PrefsSheet
        open={prefsOpen}
        settings={settings}
        onClose={() => setPrefsOpen(false)}
        onChange={updateSettings}
        onClearSearchHistory={clearSearchItems}
        onClearWatchHistory={clearWatchItems}
      />
    </>
  );
}

export function YougleApp({ logoTheme }: { logoTheme: LogoTheme }) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white" />}>
      <YougleShell logoTheme={logoTheme} />
    </Suspense>
  );
}
