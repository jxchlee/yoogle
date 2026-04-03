# yougle

yougle is a minimal YouTube search interface inspired by the simplicity of the Google home page.

The goal is simple:

- start with search, not recommendations
- keep the first screen calm and distraction-light
- let people move from search results into a focused watch page
- keep recent history optional and local to the browser

## What it does

- minimal home page with a search-first entry point
- YouTube-style search results inside yougle
- internal watch page with a large embedded player
- quick jump to the real YouTube page when needed
- optional recent search history
- optional recently watched history
- local browser storage for history and preferences

## Why it exists

Many people want to search YouTube without immediately landing on a busy recommendation-heavy page.

yougle is designed for:

- studying
- research
- focused learning
- quickly finding one specific video

## Privacy

At the moment, recent searches and watch history are stored only in the local browser on the current device.

- no account is required
- no separate yougle user database is used for this history
- users can clear the stored history from inside the app

## Tech stack

- Next.js App Router
- React
- Tailwind CSS
- YouTube Data API v3
- YouTube embedded player

## Local development

1. Install dependencies

```bash
npm install
```

2. Create local environment variables

```bash
copy .env.example .env.local
```

3. Add your YouTube API key to `.env.local`

```env
YOUTUBE_API_KEY=your_real_key_here
```

4. Start the development server

```bash
npm run dev
```

5. Open:

```text
http://localhost:3000
```

If `YOUTUBE_API_KEY` is not set, the app falls back to sample data so the UI can still be tested.

## Useful commands

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Current notes

- search suggestions currently come from local recent searches, not YouTube autocomplete
- watch history is yougle-local history, not official YouTube account history
- the project is still pre-release and may continue to change before public launch

## License

MIT
