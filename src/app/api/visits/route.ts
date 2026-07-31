import { NextResponse } from "next/server";

// Visitor counter backed by Upstash Redis REST.
// Setup (free tier): create a database at https://console.upstash.com, then add
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to your Vercel env vars.
// Without them this endpoint reports { enabled: false } and the UI hides the counter.

export async function POST() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return NextResponse.json({ enabled: false });
  }

  try {
    const response = await fetch(`${url}/incr/portfolio:visits`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Upstash responded ${response.status}`);
    }

    const data = (await response.json()) as { result?: number };
    return NextResponse.json({ enabled: true, count: data.result ?? null });
  } catch (error) {
    console.error("Visit counter error:", error);
    return NextResponse.json({ enabled: false });
  }
}
