import { NextRequest, NextResponse } from 'next/server';

type MediumPost = {
  title: string;
  link: string;
  published: string;
};

const CACHE_TTL_MS = 10 * 60 * 1000;
let cachedPosts: { timestamp: number; posts: MediumPost[] } | null = null;

const MEDIUM_USERNAME = process.env.MEDIUM_USERNAME;
const MEDIUM_FEED_URL =
  process.env.MEDIUM_FEED_URL ?? (MEDIUM_USERNAME ? `https://medium.com/feed/@${MEDIUM_USERNAME}` : null);

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTagContent(block: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = block.match(regex);
  if (!match?.[1]) {
    return null;
  }
  return decodeHtmlEntities(match[1].trim());
}

function parseFeed(xml: string, limit: number): MediumPost[] {
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)).slice(0, limit);

  return items
    .map((match) => {
      const block = match[1];
      const title = extractTagContent(block, 'title');
      const link = extractTagContent(block, 'link');
      const published = extractTagContent(block, 'pubDate');

      if (!title || !link || !published) {
        return null;
      }

      const date = new Date(published);
      return {
        title,
        link,
        published: Number.isNaN(date.valueOf()) ? new Date().toISOString() : date.toISOString()
      };
    })
    .filter(Boolean) as MediumPost[];
}

async function fetchMediumPosts(limit: number): Promise<MediumPost[]> {
  if (!MEDIUM_FEED_URL) {
    throw new Error('Medium feed URL is not configured. Set MEDIUM_USERNAME or MEDIUM_FEED_URL.');
  }

  if (cachedPosts && Date.now() - cachedPosts.timestamp < CACHE_TTL_MS) {
    return cachedPosts.posts.slice(0, limit);
  }

  const response = await fetch(MEDIUM_FEED_URL, {
    headers: {
      Accept: 'application/rss+xml',
      'User-Agent': 'Mozilla/5.0 (compatible; MediumFeedFetcher/1.0)'
    },
    cache: 'no-store',
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Medium feed: ${response.status}`);
  }

  const xml = await response.text();
  const posts = parseFeed(xml, limit || 3);

  cachedPosts = {
    timestamp: Date.now(),
    posts
  };

  return posts;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get('limit'));
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 5) : 3;

    const posts = await fetchMediumPosts(limit);
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Medium feed fetch failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to fetch Medium posts.'
      },
      { status: 500 }
    );
  }
}
