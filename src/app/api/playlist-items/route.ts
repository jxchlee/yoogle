import { NextRequest, NextResponse } from "next/server";

import { fetchPlaylistEntries } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const playlistId = request.nextUrl.searchParams.get("playlistId")?.trim();

  if (!playlistId) {
    return NextResponse.json(
      { error: "A playlistId is required." },
      { status: 400 },
    );
  }

  try {
    const items = await fetchPlaylistEntries(playlistId);
    return NextResponse.json({ items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load playlist items.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
