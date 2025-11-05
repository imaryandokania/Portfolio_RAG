import { NextResponse } from 'next/server';
import { getTrendData, logSearchQuery } from '../../../utils/analytics';

type TrendSnapshot = {
  query: string;
  hits: number;
  lastSearched: string;
};

const inMemoryStore = new Map<string, TrendSnapshot>();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getFallbackTrends(count: number) {
  const records = Array.from(inMemoryStore.values())
    .sort((a, b) => {
      if (b.hits !== a.hits) {
        return b.hits - a.hits;
      }
      return b.lastSearched.localeCompare(a.lastSearched);
    })
    .slice(0, count);

  return records;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = Number.parseInt(searchParams.get('count') ?? '5', 10) || 5;

  let records: TrendSnapshot[] = [];
  try {
    records = await getTrendData(count, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  } catch (error) {
    console.warn('Trend fetch fell back to memory store', error);
  }

  if (!records.length) {
    records = getFallbackTrends(count);
  }

  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const query = (body?.query as string | undefined)?.trim();

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  const timestamp = new Date().toISOString();
  const existing = inMemoryStore.get(query) ?? { query, hits: 0, lastSearched: timestamp };
  inMemoryStore.set(query, {
    query,
    hits: existing.hits + 1,
    lastSearched: timestamp
  });

  try {
    await logSearchQuery(query, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  } catch (error) {
    console.warn('Upstream search log failed', error);
  }

  return NextResponse.json({ ok: true });
}
