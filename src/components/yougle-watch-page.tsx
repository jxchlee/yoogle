"use client";

import Image from "next/image";
import {
  Suspense,
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { SearchForm } from "@/components/yougle-common";
import { HistorySheet, PrefsSheet } from "@/components/yougle-sheets";
import type { SearchResponse, SearchResult, WatchHistoryItem } from "@/lib/types";
import {
  DEFAULT_SETTINGS,
  readStore,
  saveSearch,
  saveWatch,
  SEARCH_HISTORY_KEY,
  SETTINGS_KEY,
  suggestionsFor,
  WATCH_HISTORY_KEY,
  watchHistoryToResult,
  writeStore,
} from "@/lib/yougle-client";

function WatchPageShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeQuery = searchParams.get("q")?.trim() ?? "";
  const videoId = searchParams.get("video") ?? "";

  const [inputValue, setInputValue] = useState(activeQuery);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"sample" | "youtube" | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const deferredInput = useDeferredValue(inputValue);

  useEffect(() => {
    setInputValue(activeQuery);
  }, [activeQuery]);

  useEffect(() => {
    setSettings(readStore(SETTINGS_KEY, DEFAULT_SETTINGS));
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

  const persistSearchHistory = (next: string[]) => {
    setSearchHistory(next);
    writeStore(SEARCH_HISTORY_KEY, next);
  };

  const persistWatchHistory = (next: WatchHistoryItem[]) => {
    setWatchHistory(next);
    writeStore(WATCH_HISTORY_KEY, next);
  };

  const runSearch = useEffectEvent(async (query: string) => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(trimmed)}&regionCode=${settings.regionCode}`,
        { cache: "no-store" },
      );

      const payload = (await response.json()) as SearchResponse | { error: string };

      if (!response.ok || !("items" in payload)) {
        throw new Error(
          "error" in payload ? payload.error : "Search could not be completed.",
        );
      }

      setResults(payload.items);
      setSource(payload.source);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Search could not be completed.",
      );
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    void runSearch(activeQuery);
  }, [activeQuery, settings.regionCode]);

  useEffect(() => {
    if (!videoId) {
      setSelectedVideo(null);
      return;
    }

    const match = results.find((item) => item.id === videoId);

    if (match) {
      setSelectedVideo(match);
      return;
    }

    const watched = watchHistory.find((item) => item.id === videoId);

    if (watched) {
      setSelectedVideo(watchHistoryToResult(watched));
    }
  }, [results, videoId, watchHistory]);

  const submitSearch = (query: string) => {
    const trimmed = query.trim();
    setInputValue(trimmed);
    setHistoryOpen(false);
    setPrefsOpen(false);

    if (trimmed && settings.searchHistoryEnabled) {
      persistSearchHistory(saveSearch(searchHistory, trimmed));
    }

    startTransition(() => {
      const next = new URLSearchParams();
      next.set("q", trimmed);
      router.push(`/?${next.toString()}`);
    });
  };

  const openVideo = (video: SearchResult) => {
    setSelectedVideo(video);

    if (settings.watchHistoryEnabled) {
      persistWatchHistory(saveWatch(watchHistory, video));
    }

    startTransition(() => {
      const next = new URLSearchParams();
      next.set("video", video.id);

      if (activeQuery) {
        next.set("q", activeQuery);
      }

      router.push(`/watch?${next.toString()}`);
    });
  };

  const removeSearchItem = (query: string) => {
    persistSearchHistory(searchHistory.filter((item) => item !== query));
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

  const sideResults = results.filter((item) => item.id !== selectedVideo?.id);

  return (
    <>
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => router.push(activeQuery ? `/?q=${encodeURIComponent(activeQuery)}` : "/")}
              className="cursor-pointer rounded-full px-4 py-2 text-sm text-[#202124] hover:bg-[#f1f3f4]"
            >
              Back
            </button>
            <div className="max-w-[720px] flex-1">
              <SearchForm
                value={inputValue}
                suggestions={suggestions}
                compact
                onChange={setInputValue}
                onSubmit={submitSearch}
                onRemoveSuggestion={removeSearchItem}
              />
            </div>
            <div className="flex items-center gap-2">
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

        <main className="mx-auto max-w-[1400px] px-4 pb-12 pt-6 sm:px-6">
          {error ? (
            <div className="mb-6 rounded-2xl border border-[#f1c0c0] bg-[#fff6f6] px-4 py-4 text-sm text-[#c5221f]">
              {error}
            </div>
          ) : null}

          {!selectedVideo && !isLoading ? (
            <div className="rounded-2xl border border-[var(--line)] px-5 py-8 text-sm text-[#606060]">
              This video could not be loaded. Try opening another result.
            </div>
          ) : null}

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="min-w-0">
              {selectedVideo ? (
                <>
                  <div className="overflow-hidden rounded-2xl bg-black">
                    <div className="aspect-video">
                      <iframe
                        title={selectedVideo.title}
                        src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&playsinline=1&rel=0`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <h1 className="text-2xl font-medium leading-9 text-[#0f0f0f]">
                      {selectedVideo.title}
                    </h1>
                    <p className="mt-3 text-sm text-[#606060]">
                      {selectedVideo.channelTitle} - {selectedVideo.viewCount ?? "Views hidden"} -{" "}
                      {selectedVideo.publishedLabel}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <a
                        href={`https://www.youtube.com/watch?v=${selectedVideo.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="youtube-link-button cursor-pointer rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
                      >
                        Open on YouTube
                      </a>
                      {source === "sample" ? (
                        <span className="rounded-full bg-[#fff8e1] px-3 py-2 text-xs text-[#8d6e63]">
                          Sample mode
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-5 rounded-2xl bg-[#f8f9fa] px-5 py-4">
                      <p className="text-sm leading-7 text-[#3c4043]">
                        {selectedVideo.description || "No description available."}
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
            </section>

            <aside>
              <div className="mb-4">
                <h2 className="text-base font-medium text-[#202124]">
                  {activeQuery ? `More results for "${activeQuery}"` : "More videos"}
                </h2>
              </div>

              {isLoading ? (
                <div className="text-sm text-[#606060]">Loading videos...</div>
              ) : (
                <div className="space-y-4">
                  {sideResults.map((item) => (
                    <button
                      key={`${item.id}-${item.publishedAt}`}
                      type="button"
                      onClick={() => openVideo(item)}
                      className="flex w-full cursor-pointer gap-3 text-left"
                    >
                      <div className="relative w-[168px] shrink-0 overflow-hidden rounded-xl bg-[#0f0f0f]">
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.title}
                          width={336}
                          height={188}
                          className="aspect-video w-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
                          {item.duration}
                        </span>
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="line-clamp-2 text-sm leading-6 text-[#0f0f0f]">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-[#606060]">{item.channelTitle}</p>
                        <p className="mt-1 text-xs text-[#606060]">
                          {item.viewCount ?? "Views hidden"} - {item.publishedLabel}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </main>
      </div>

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
        onRemoveWatch={(id) =>
          persistWatchHistory(watchHistory.filter((item) => item.id !== id))
        }
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

export function YougleWatchPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white" />}>
      <WatchPageShell />
    </Suspense>
  );
}
