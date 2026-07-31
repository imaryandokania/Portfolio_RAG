import { NextRequest, NextResponse } from "next/server";

// Visitor message drop-box (backed by Upstash Redis, same env vars as the visit counter).
// POST { name, contact, message }        → stores the message
// GET  ?token=<MESSAGES_ADMIN_TOKEN>     → Aryan reads his messages

const MAX_FIELD = 500;

function upstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

export async function POST(request: NextRequest) {
  const store = upstash();
  if (!store) {
    return NextResponse.json({ stored: false, reason: "not_configured" });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      contact?: string;
      message?: string;
    };
    const name = String(body.name ?? "anonymous").slice(0, MAX_FIELD);
    const contact = String(body.contact ?? "not provided").slice(0, MAX_FIELD);
    const message = String(body.message ?? "").slice(0, MAX_FIELD * 2);

    if (!message.trim()) {
      return NextResponse.json({ stored: false, reason: "empty_message" }, { status: 400 });
    }

    const entry = JSON.stringify({
      name,
      contact,
      message,
      at: new Date().toISOString()
    });

    const res = await fetch(`${store.url}/lpush/portfolio:messages/${encodeURIComponent(entry)}`, {
      headers: { Authorization: `Bearer ${store.token}` },
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error(`upstash ${res.status}`);
    }
    return NextResponse.json({ stored: true });
  } catch (error) {
    console.error("Message store failed:", error);
    return NextResponse.json({ stored: false, reason: "error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const adminToken = process.env.MESSAGES_ADMIN_TOKEN;
  const provided = request.nextUrl.searchParams.get("token");
  if (!adminToken || provided !== adminToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const store = upstash();
  if (!store) {
    return NextResponse.json({ messages: [], note: "Upstash not configured" });
  }

  try {
    const res = await fetch(`${store.url}/lrange/portfolio:messages/0/99`, {
      headers: { Authorization: `Bearer ${store.token}` },
      cache: "no-store"
    });
    const data = (await res.json()) as { result?: string[] };
    const messages = (data.result ?? []).map((raw) => {
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        return raw;
      }
    });
    return NextResponse.json({ count: messages.length, messages });
  } catch (error) {
    console.error("Message read failed:", error);
    return NextResponse.json({ error: "read_failed" }, { status: 500 });
  }
}
