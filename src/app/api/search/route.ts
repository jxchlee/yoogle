import { NextRequest, NextResponse } from "next/server";

import { searchYouTube } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.trim();
  const pageToken = searchParams.get("pageToken")?.trim() ?? undefined;
  const regionCode = searchParams.get("regionCode")?.trim() || "KR";

  if (!query) {
    return NextResponse.json(
      { error: "A search query is required." },
      { status: 400 },
    );
  }

  try {
    const results = await searchYouTube({ query, pageToken, regionCode });
    return NextResponse.json(results);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load YouTube results.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
