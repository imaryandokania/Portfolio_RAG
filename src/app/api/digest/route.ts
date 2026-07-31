import { NextRequest, NextResponse } from "next/server";

// Daily digest: emails Aryan new visitor messages — but ONLY if there are any.
// Triggered by Vercel Cron (see vercel.json). Requires env:
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN  (message store)
//   RESEND_API_KEY                                      (email sending, resend.com free tier)
//   DIGEST_TO (optional, defaults to aryandokania2001@gmail.com)
//   CRON_SECRET (optional but recommended — Vercel sends it automatically)

const DIGEST_KEY = "portfolio:messages:digested";
const MESSAGES_KEY = "portfolio:messages";

type StoredMessage = { name?: string; contact?: string; message?: string; at?: string };

async function redis(cmd: (string | number)[]): Promise<{ result?: unknown } | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd.map(String)),
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`upstash ${res.status} on ${cmd[0]}`);
  return (await res.json()) as { result?: unknown };
}

export async function GET(request: NextRequest) {
  // Vercel Cron auth (if CRON_SECRET configured)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ sent: false, reason: "RESEND_API_KEY not configured" });
  }

  try {
    const lenRes = await redis(["LLEN", MESSAGES_KEY]);
    if (!lenRes) {
      return NextResponse.json({ sent: false, reason: "Upstash not configured" });
    }
    const total = Number(lenRes.result ?? 0);

    const digestedRes = await redis(["GET", DIGEST_KEY]);
    const digested = Number(digestedRes?.result ?? 0);

    const newCount = total - digested;
    if (newCount <= 0) {
      return NextResponse.json({ sent: false, reason: "no new messages" });
    }

    // newest messages are at the head of the list
    const rangeRes = await redis(["LRANGE", MESSAGES_KEY, 0, newCount - 1]);
    const raw = (rangeRes?.result ?? []) as string[];
    const messages: StoredMessage[] = raw.map((entry) => {
      try {
        return JSON.parse(entry) as StoredMessage;
      } catch {
        return { message: entry };
      }
    });

    const rows = messages
      .map(
        (m) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee;">
            <strong>${m.name ?? "anonymous"}</strong><br/>
            <span style="color:#666;">${m.contact ?? "no contact"}</span><br/>
            <p style="margin:6px 0 0;">${m.message ?? ""}</p>
            <span style="color:#999;font-size:12px;">${m.at ?? ""}</span>
          </td>
        </tr>`
      )
      .join("");

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Portfolio Agent <onboarding@resend.dev>",
        to: [process.env.DIGEST_TO ?? "aryandokania2001@gmail.com"],
        subject: `🤖 ${newCount} new message${newCount === 1 ? "" : "s"} from your portfolio`,
        html: `
          <h2>Your portfolio agent took ${newCount} message${newCount === 1 ? "" : "s"}</h2>
          <table style="width:100%;border-collapse:collapse;font-family:sans-serif;">${rows}</table>
          <p style="color:#999;font-size:12px;margin-top:16px;">
            Sent by aryandokania.vercel.app · only emails you when there's something new
          </p>`
      })
    });

    if (!emailRes.ok) {
      const detail = await emailRes.text().catch(() => "");
      throw new Error(`resend ${emailRes.status}: ${detail.slice(0, 200)}`);
    }

    await redis(["SET", DIGEST_KEY, total]);
    return NextResponse.json({ sent: true, newCount });
  } catch (error) {
    console.error("Digest failed:", error);
    return NextResponse.json({ sent: false, reason: "error" }, { status: 500 });
  }
}
