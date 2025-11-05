type TrendRecord = {
  query: string;
  hits: number;
  lastSearched: string;
};

async function fetchFromEdge(url: string, serviceKey: string, payload: Record<string, unknown>) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn('Edge request failed', error);
    return null;
  }
}

export async function getTrendData(count: number, supabaseUrl?: string, serviceKey?: string) {
  if (!supabaseUrl || !serviceKey) {
    return [] as TrendRecord[];
  }

  const result = await fetchFromEdge(`${supabaseUrl}/functions/v1/resume-trends`, serviceKey, { count });
  if (!result || !Array.isArray(result.records)) {
    return [] as TrendRecord[];
  }

  return result.records as TrendRecord[];
}

export async function logSearchQuery(query: string, supabaseUrl?: string, serviceKey?: string) {
  if (!query || !supabaseUrl || !serviceKey) {
    return;
  }

  await fetchFromEdge(`${supabaseUrl}/functions/v1/resume-search-log`, serviceKey, {
    query,
    timestamp: new Date().toISOString()
  });
}

export type { TrendRecord };
