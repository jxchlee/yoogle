import Link from "next/link";

import { SiteFooter } from "@/components/yougle-common";

export default function InfoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex-1">
        <header className="border-b border-[var(--line)]">
          <div className="mx-auto flex max-w-[960px] items-center gap-4 px-4 py-4 sm:px-6">
            <Link
              href="/"
              className="rounded-full px-4 py-2 text-sm text-[#202124] hover:bg-[#f1f3f4]"
            >
              Back
            </Link>
            <h1 className="text-lg font-medium text-[#202124]">About yougle</h1>
          </div>
        </header>

        <section className="mx-auto max-w-[960px] px-4 py-12 sm:px-6">
          <div className="max-w-3xl space-y-8">
            <div>
              <p className="text-sm text-[#5f6368]">What is yougle?</p>
              <h2 className="mt-2 text-3xl font-medium text-[#202124]">
                A simpler way to search YouTube.
              </h2>
            </div>

            <p className="text-base leading-8 text-[#3c4043]">
              yougle is a minimal interface for searching and watching YouTube content
              with less distraction.
            </p>

            <p className="text-base leading-8 text-[#3c4043]">
              It starts with search first, keeps recent history optional, and stores
              that history locally in your browser on this device.
            </p>

            <p className="text-base leading-8 text-[#3c4043]">
              yougle is an unofficial project and is not affiliated with YouTube.
              For full project notes, technical details, and source code, see GitHub.
            </p>

            <div className="pt-2">
              <a
                href="https://github.com/jxchlee/yoogle"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-[var(--line)] px-5 py-2.5 text-sm font-medium text-[#202124] hover:bg-[#f8f9fa]"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
