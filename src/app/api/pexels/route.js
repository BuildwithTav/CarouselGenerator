import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const per_page = searchParams.get("per_page") || "20";
  const page = searchParams.get("page") || "1";

  if (!query || !query.trim()) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Pexels not configured" }, { status: 500 });
  }

  try {
    const url = "https://api.pexels.com/v1/search?" + new URLSearchParams({
      query: query.trim(),
      per_page,
      page,
      orientation: "portrait",
    });

    const res = await fetch(url, {
      headers: { Authorization: apiKey },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Pexels API error" }, { status: res.status });
    }

    const data = await res.json();

    const photos = (data.photos || []).map(p => ({
      id: p.id,
      url: p.src.large2x || p.src.large || p.src.original,
      thumb: p.src.medium,
      alt: p.alt || "",
      photographer: p.photographer,
    }));

    return NextResponse.json({
      photos,
      total_results: data.total_results,
      page: data.page,
      next_page: data.next_page || null,
    });
  } catch (e) {
    console.error("Pexels proxy error:", e);
    return NextResponse.json({ error: "Failed to fetch from Pexels" }, { status: 500 });
  }
}
