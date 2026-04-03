import Link from "next/link";

export default function InfoPage() {
  return (
    <main className="min-h-screen bg-white">
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
            yougle starts with a clean search box, so you can look for a video
            without being pushed into a busy homepage first. It is made for people
            who want a calmer YouTube search experience with fewer distractions.
          </p>

          <p className="text-base leading-8 text-[#3c4043]">
            This is especially useful when you are studying, researching, working,
            or just trying to find one specific video quickly.
          </p>

          <div className="rounded-3xl border border-[var(--line)] px-6 py-6">
            <h3 className="text-lg font-medium text-[#202124]">Why it feels lighter</h3>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[#3c4043]">
              <li>The main page stays minimal, so you can start with search right away.</li>
              <li>Search results stay inside yougle, so the flow feels more focused.</li>
              <li>Recent searches and watched videos are optional, so you can keep convenience without clutter.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-[var(--line)] px-6 py-6">
            <h3 className="text-lg font-medium text-[#202124]">Privacy and local storage</h3>
            <p className="mt-4 text-sm leading-7 text-[#3c4043]">
              your recent searches and watched history are currently stored only in
              your own browser on this device. They are not saved to a separate
              yougle server.
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[#3c4043]">
              <li>That means your history is less exposed than a server-synced system.</li>
              <li>It also makes the service simpler and faster, because there is no account or sync setup.</li>
              <li>You can clear the stored history whenever you want from the app.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
