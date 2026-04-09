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

import { Logo, SearchForm, SiteFooter } from "@/components/yougle-common";
import { HistorySheet, PrefsSheet } from "@/components/yougle-sheets";
import type { SearchResponse, SearchResult, WatchHistoryItem } from "@/lib/types";
import type { LogoTheme } from "@/lib/logo-theme";
import {
  DEFAULT_SETTINGS,
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

function parseStartTimeToSeconds(value: string) {
  const parts = value
    .trim()
    .split(":")
    .map((part) => Number(part));

  if (parts.some((part) => Number.isNaN(part) || part < 0)) {
    return 0;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  if (parts.length === 1) {
    return parts[0] ?? 0;
  }

  return 0;
}

function sanitizeStartSeconds(value: string | null) {
  const seconds = Number(value ?? "0");

  if (Number.isNaN(seconds) || seconds < 0) {
    return 0;
  }

  return Math.floor(seconds);
}

function escapeHtmlAttribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function WatchPageShell({ logoTheme }: { logoTheme: LogoTheme }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeQuery = searchParams.get("q")?.trim() ?? "";
  const videoId = searchParams.get("video") ?? "";
  const startAt = sanitizeStartSeconds(searchParams.get("t"));

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
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMode, setShareMode] = useState<"link" | "embed">("link");
  const [shareCopyState, setShareCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [includeStartTime, setIncludeStartTime] = useState(false);
  const [startTimeInput, setStartTimeInput] = useState("0:00");
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
      const cachedPayload = getSearchCache(trimmed, settings.regionCode);

      if (cachedPayload) {
        setResults(cachedPayload.items);
        setSource(cachedPayload.source);
        return;
      }

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

      setSearchCache(trimmed, settings.regionCode, null, payload);
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
    setShareOpen(false);
    setShareCopyState("idle");
    setIncludeStartTime(false);
    setStartTimeInput("0:00");

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

  const sideResults =
    results.length > 0
      ? results.filter((item) => item.id !== selectedVideo?.id)
      : watchHistory
          .filter((item) => item.id !== selectedVideo?.id)
          .map(watchHistoryToResult);
  const manualStartSeconds = includeStartTime ? parseStartTimeToSeconds(startTimeInput) : 0;
  const shareUrl =
    selectedVideo && typeof window !== "undefined"
      ? `${window.location.origin}/watch?video=${selectedVideo.id}${
          activeQuery ? `&q=${encodeURIComponent(activeQuery)}` : ""
        }${includeStartTime && manualStartSeconds > 0 ? `&t=${manualStartSeconds}` : ""}`
      : "";
  const embedUrl = selectedVideo
    ? `https://www.youtube.com/embed/${selectedVideo.id}?rel=0${
        includeStartTime && manualStartSeconds > 0 ? `&start=${manualStartSeconds}` : ""
      }`
    : "";
  const embedCode = selectedVideo
    ? `<iframe width="560" height="315" src="${embedUrl}" title="${escapeHtmlAttribute(
        selectedVideo.title,
      )}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
    : "";

  const handleShareCopy = async () => {
    if (!selectedVideo) {
      return;
    }

    const textToCopy = shareMode === "embed" ? embedCode : shareUrl;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setShareCopyState("copied");
      window.setTimeout(() => setShareCopyState("idle"), 1600);
    } catch {
      setShareCopyState("failed");
      window.setTimeout(() => setShareCopyState("idle"), 1600);
    }
  };

  return (
    <>
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
                        src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&playsinline=1&rel=0${startAt > 0 ? `&start=${startAt}` : ""}`}
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
                        className="youtube-link-button inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors"
                      >
                        Open on YouTube
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setShareOpen(true);
                          setShareMode("link");
                        }}
                        className="cursor-pointer rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-medium text-[#202124] transition-colors hover:bg-[#f8f9fa]"
                      >
                        Share
                      </button>
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
        <SiteFooter />
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

      {shareOpen && selectedVideo ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4"
          onClick={() => setShareOpen(false)}
        >
          <div
            className="w-full max-w-[520px] rounded-3xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.25)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5">
              <h2 className="text-[28px] font-medium text-[#202124]">Share</h2>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="cursor-pointer rounded-full p-2 text-[#202124] hover:bg-[#f1f3f4]"
              >
                x
              </button>
            </div>

            <div className="border-b border-[var(--line)] px-6 pb-5">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShareMode("embed")}
                  className={`cursor-pointer rounded-full px-5 py-3 text-sm font-medium ${
                    shareMode === "embed"
                      ? "bg-[#f1f3f4] text-[#202124]"
                      : "bg-white text-[#606060]"
                  }`}
                >
                  Embed
                </button>
                <button
                  type="button"
                  onClick={() => setShareMode("link")}
                  className={`cursor-pointer rounded-full px-5 py-3 text-sm font-medium ${
                    shareMode === "link"
                      ? "bg-[#f1f3f4] text-[#202124]"
                      : "bg-white text-[#606060]"
                  }`}
                >
                  Link
                </button>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] px-4 py-3">
                {shareMode === "embed" ? (
                  <textarea
                    readOnly
                    rows={4}
                    value={embedCode}
                    className="w-full resize-none bg-transparent text-sm leading-6 text-[#202124] outline-none"
                  />
                ) : (
                  <input
                    readOnly
                    value={shareUrl}
                    className="w-full bg-transparent text-sm text-[#202124] outline-none"
                  />
                )}
                <button
                  type="button"
                  onClick={handleShareCopy}
                  className="cursor-pointer rounded-full bg-[#065fd4] px-5 py-2.5 text-sm font-medium text-white"
                >
                  {shareCopyState === "copied"
                    ? "Copied"
                    : shareCopyState === "failed"
                      ? "Failed"
                      : "Copy"}
                </button>
              </div>

              <div className="mt-6 border-t border-[var(--line)] pt-5">
                <label className="flex items-center gap-3 text-sm text-[#202124]">
                  <input
                    type="checkbox"
                    checked={includeStartTime}
                    onChange={(event) => setIncludeStartTime(event.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-[#202124]"
                  />
                  <span>Start at:</span>
                  <input
                    value={startTimeInput}
                    onChange={(event) => setStartTimeInput(event.target.value)}
                    disabled={!includeStartTime}
                    className="w-20 rounded-md border border-[var(--line)] px-2 py-1 text-sm text-[#606060] disabled:border-transparent disabled:bg-transparent"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function YougleWatchPage({ logoTheme }: { logoTheme: LogoTheme }) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white" />}>
      <WatchPageShell logoTheme={logoTheme} />
    </Suspense>
  );
}
