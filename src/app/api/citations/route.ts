import { NextResponse } from "next/server";

// Live citation counts from Semantic Scholar (cached 24h).
// Keyed by paper title; UI shows a "cited by N" badge when available.

export const revalidate = 86400;

const PAPERS: { title: string; s2id?: string }[] = [
  {
    title: "CodeNib: A Multi-View Data System for Serving Repository Context to Coding Agents",
    s2id: "arXiv:2607.25431"
  },
  {
    title: "Improving Learning to Optimize Using Parameter Symmetries",
    s2id: "arXiv:2504.15399"
  },
  { title: "Enhanced Grammar Error Detection and Correction Using Hybrid Algorithm" },
  { title: "Secure File Sharing System Using Hybrid Authentication and Secured Key" }
];

async function fetchCitationCount(paper: { title: string; s2id?: string }): Promise<number | null> {
  try {
    if (paper.s2id) {
      const res = await fetch(
        `https://api.semanticscholar.org/graph/v1/paper/${paper.s2id}?fields=citationCount`,
        { next: { revalidate: 86400 } }
      );
      if (res.ok) {
        const data = (await res.json()) as { citationCount?: number };
        return data.citationCount ?? null;
      }
    }
    const search = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(paper.title)}&fields=title,citationCount&limit=1`,
      { next: { revalidate: 86400 } }
    );
    if (!search.ok) {
      return null;
    }
    const data = (await search.json()) as {
      data?: { title?: string; citationCount?: number }[];
    };
    const hit = data.data?.[0];
    if (!hit?.title) {
      return null;
    }
    // only trust close title matches
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!normalize(hit.title).startsWith(normalize(paper.title).slice(0, 30))) {
      return null;
    }
    return hit.citationCount ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const counts: Record<string, number> = {};
  await Promise.all(
    PAPERS.map(async (paper) => {
      const count = await fetchCitationCount(paper);
      if (count !== null && count > 0) {
        counts[paper.title] = count;
      }
    })
  );
  return NextResponse.json({ counts });
}
