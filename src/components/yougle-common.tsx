"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

function GearIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] fill-none stroke-current stroke-2"
    >
      <path d="M12 3l1.2 2.74L16 6.3l2.06-1.24 1.88 3.24L18 10.1l.08 2.8 1.86 1.84-1.88 3.24L16 16.74l-2.8.56L12 20l-1.2-2.7-2.8-.56-2.06 1.24-1.88-3.24L6 12.9l-.08-2.8L4.06 8.26l1.88-3.24L8 6.26l2.8-.52L12 3z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`select-none font-medium tracking-tight ${
        small ? "text-[1.7rem]" : "text-[5rem] sm:text-[5.8rem]"
      }`}
    >
      <span className="text-[#4285f4]">y</span>
      <span className="text-[#ea4335]">o</span>
      <span className="text-[#fbbc05]">u</span>
      <span className="text-[#4285f4]">g</span>
      <span className="text-[#34a853]">l</span>
      <span className="text-[#ea4335]">e</span>
    </div>
  );
}

export function TopBar({
  showInfo,
  absolute,
  onOpenHistory,
  onOpenPrefs,
}: {
  showInfo: boolean;
  absolute?: boolean;
  onOpenHistory: () => void;
  onOpenPrefs: () => void;
}) {
  return (
    <header className={absolute ? "absolute inset-x-0 top-0 z-10" : ""}>
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 sm:px-6">
        <div>
          {showInfo ? (
            <Link
              href="/info"
              className="cursor-pointer rounded-full px-4 py-2 text-sm text-[#3c4043] transition-colors hover:bg-[#f1f3f4]"
            >
              Info
            </Link>
          ) : (
            <div className="h-10 w-[72px]" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenHistory}
            className="cursor-pointer rounded-full bg-[#f2f2f2] px-4 py-2 text-sm text-[#202124] hover:bg-[#e8eaed]"
          >
            History
          </button>
          <button
            type="button"
            onClick={onOpenPrefs}
            aria-label="Preferences"
            className="cursor-pointer rounded-full bg-[#f2f2f2] p-2.5 text-[#202124] hover:bg-[#e8eaed]"
          >
            <GearIcon />
          </button>
        </div>
      </div>
    </header>
  );
}

export function SearchForm({
  value,
  suggestions,
  compact = false,
  onChange,
  onSubmit,
  onRemoveSuggestion,
}: {
  value: string;
  suggestions: string[];
  compact?: boolean;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onRemoveSuggestion?: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(value);
    setFocused(false);
  };

  return (
    <div className="relative w-full">
      <form
        onSubmit={submit}
        className={`google-search-shell flex items-center rounded-full border border-[var(--line)] bg-white px-4 ${
          compact ? "min-h-11" : "min-h-12"
        }`}
      >
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          placeholder="Search YouTube"
          className="w-full bg-transparent text-[16px] outline-none placeholder:text-[#5f6368]"
        />
        <button
          type="submit"
          className="cursor-pointer border-l border-[var(--line)] pl-4 text-sm text-[#5f6368]"
        >
          Search
        </button>
      </form>

      {focused && suggestions.length > 0 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-3xl border border-[var(--line)] bg-white py-2 shadow-[0_4px_18px_rgba(32,33,36,0.18)]">
          {suggestions.map((item) => (
            <div key={item} className="flex items-center gap-2 px-2">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSubmit(item)}
                className="cursor-pointer block flex-1 rounded-2xl px-3 py-2 text-left text-sm text-[#202124] hover:bg-[#f8f9fa]"
              >
                {item}
              </button>
              {onRemoveSuggestion ? (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveSuggestion(item);
                  }}
                  className="cursor-pointer rounded-full px-2 py-1 text-xs text-[#5f6368] hover:bg-[#e8eaed]"
                >
                  x
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-white">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-6 text-sm text-[#5f6368] sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p>Minimal YouTube search with fewer distractions.</p>
          <p>Unofficial project. Content belongs to YouTube and its respective owners.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/info" className="hover:text-[#202124]">
            Info
          </Link>
          <a
            href="https://github.com/jxchlee/yoogle"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#202124]"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
