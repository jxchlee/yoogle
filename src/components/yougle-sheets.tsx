"use client";

import Image from "next/image";

import type { StoredSettings, WatchHistoryItem } from "@/lib/types";
import { timeAgo } from "@/lib/yougle-client";

function SideSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 bg-black/20" onClick={onClose}>
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-sm border-l border-[var(--line)] bg-white px-5 py-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <h2 className="text-base font-medium text-[#202124]">{title}</h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-sm">
            Close
          </button>
        </div>
        <div className="pt-5">{children}</div>
      </aside>
    </div>
  );
}

export function HistorySheet({
  open,
  searchHistory,
  watchHistory,
  onClose,
  onSearchSelect,
  onWatchSelect,
  onRemoveSearch,
  onRemoveWatch,
  onClearSearch,
  onClearWatch,
}: {
  open: boolean;
  searchHistory: string[];
  watchHistory: WatchHistoryItem[];
  onClose: () => void;
  onSearchSelect: (query: string) => void;
  onWatchSelect: (item: WatchHistoryItem) => void;
  onRemoveSearch: (query: string) => void;
  onRemoveWatch: (id: string) => void;
  onClearSearch: () => void;
  onClearWatch: () => void;
}) {
  return (
    <SideSheet open={open} title="History" onClose={onClose}>
      <div className="space-y-8">
        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[#202124]">Recent searches</h3>
            {searchHistory.length > 0 ? (
              <button
                type="button"
                onClick={onClearSearch}
                className="cursor-pointer text-xs text-[#5f6368] hover:text-[#202124]"
              >
                Clear all
              </button>
            ) : null}
          </div>
          <div className="mt-3 space-y-2">
            {searchHistory.length === 0 ? (
              <p className="text-sm text-[#5f6368]">No recent searches yet.</p>
            ) : (
              searchHistory.map((item) => (
                <div key={item} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSearchSelect(item)}
                    className="block w-full cursor-pointer rounded-xl px-3 py-2 pr-9 text-left text-sm hover:bg-[#f8f9fa]"
                  >
                    {item}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveSearch(item);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-full px-2 py-1 text-xs text-[#5f6368] opacity-0 transition-opacity hover:bg-[#e8eaed] group-hover:opacity-100"
                  >
                    x
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[#202124]">Recently watched</h3>
            {watchHistory.length > 0 ? (
              <button
                type="button"
                onClick={onClearWatch}
                className="cursor-pointer text-xs text-[#5f6368] hover:text-[#202124]"
              >
                Clear all
              </button>
            ) : null}
          </div>
          <div className="mt-3 space-y-3">
            {watchHistory.length === 0 ? (
              <p className="text-sm text-[#5f6368]">No watched videos yet.</p>
            ) : (
              watchHistory.map((item) => (
                <div key={item.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onWatchSelect(item)}
                    className="flex w-full cursor-pointer gap-3 rounded-xl px-2 py-2 text-left hover:bg-[#f8f9fa]"
                  >
                    <Image
                      src={item.thumbnailUrl}
                      alt={item.title}
                      width={96}
                      height={54}
                      className="rounded-lg object-cover"
                    />
                    <div className="min-w-0 pr-7">
                      <p className="line-clamp-2 text-sm text-[#202124]">{item.title}</p>
                      <p className="mt-1 text-xs text-[#606060]">{item.channelTitle}</p>
                      <p className="mt-1 text-xs text-[#606060]">{timeAgo(item.watchedAt)}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveWatch(item.id);
                    }}
                    className="absolute right-2 top-2 cursor-pointer rounded-full px-2 py-1 text-xs text-[#5f6368] opacity-0 transition-opacity hover:bg-[#e8eaed] group-hover:opacity-100"
                  >
                    x
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </SideSheet>
  );
}

export function PrefsSheet({
  open,
  settings,
  onClose,
  onChange,
  onClearSearchHistory,
  onClearWatchHistory,
}: {
  open: boolean;
  settings: StoredSettings;
  onClose: () => void;
  onChange: (settings: StoredSettings) => void;
  onClearSearchHistory: () => void;
  onClearWatchHistory: () => void;
}) {
  return (
    <SideSheet open={open} title="Preferences" onClose={onClose}>
      <div className="space-y-5">
        <label className="flex items-center justify-between rounded-2xl border border-[var(--line)] px-4 py-4">
          <span className="text-sm text-[#202124]">Search history</span>
          <input
            type="checkbox"
            checked={settings.searchHistoryEnabled}
            onChange={(event) =>
              onChange({
                ...settings,
                searchHistoryEnabled: event.target.checked,
              })
            }
            className="cursor-pointer h-4 w-4 accent-[#1a73e8]"
          />
        </label>

        <label className="flex items-center justify-between rounded-2xl border border-[var(--line)] px-4 py-4">
          <span className="text-sm text-[#202124]">Watch history</span>
          <input
            type="checkbox"
            checked={settings.watchHistoryEnabled}
            onChange={(event) =>
              onChange({
                ...settings,
                watchHistoryEnabled: event.target.checked,
              })
            }
            className="cursor-pointer h-4 w-4 accent-[#1a73e8]"
          />
        </label>

        <label className="block rounded-2xl border border-[var(--line)] px-4 py-4">
          <span className="text-sm text-[#202124]">Region</span>
          <select
            value={settings.regionCode}
            onChange={(event) =>
              onChange({ ...settings, regionCode: event.target.value })
            }
            className="mt-4 h-10 w-full cursor-pointer rounded-xl border border-[var(--line)] px-3 text-sm outline-none"
          >
            <option value="KR">Korea</option>
            <option value="US">United States</option>
            <option value="JP">Japan</option>
            <option value="GB">United Kingdom</option>
          </select>
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClearSearchHistory}
            className="cursor-pointer rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[#202124]"
          >
            Clear searches
          </button>
          <button
            type="button"
            onClick={onClearWatchHistory}
            className="cursor-pointer rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[#202124]"
          >
            Clear watched
          </button>
        </div>
      </div>
    </SideSheet>
  );
}
