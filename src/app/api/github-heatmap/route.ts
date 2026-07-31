import { NextResponse } from "next/server";

// Proxies GitHub contribution data (avoids CORS, adds caching).
// Falls back gracefully — UI hides the heatmap if unavailable.

export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch(
      "https://github-contributions-api.jogruber.de/v4/imaryandokania?y=last",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) {
      throw new Error(`upstream ${res.status}`);
    }
    const data = (await res.json()) as {
      total?: Record<string, number>;
      contributions?: { date: string; count: number; level: number }[];
    };
    return NextResponse.json({
      enabled: true,
      total: Object.values(data.total ?? {}).reduce((a, b) => a + b, 0),
      contributions: data.contributions ?? []
    });
  } catch (error) {
    console.error("Heatmap fetch failed:", error);
    return NextResponse.json({ enabled: false });
  }
}
