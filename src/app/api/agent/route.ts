import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  buildResumeContext,
  buildResumeDocuments,
  ResumeDocument,
} from "../../../utils/resumeDocuments";

const EMBEDDING_MODEL = "text-embedding-3-small";
const CHAT_MODEL = "gpt-4o-mini";
const MAX_CONTEXT_DOCUMENTS = 6;
const MAX_QUERY_CHARS = 500;

const docs = buildResumeDocuments();
let cachedEmbeddings: number[][] | null = null;

const MAX_CONVERSATION_TURNS = 3;
const MAX_FOLLOW_UP_CHARS = 800;

type ConversationTurn = {
  question: string;
  answer: string;
};

function detectEnrichments(query: string): EnrichmentHint[] {
  const normalized = query.toLowerCase();
  const matches = new Set<EnrichmentHint>();

  (Object.keys(ENRICHMENT_KEYWORDS) as EnrichmentHint[]).forEach((key) => {
    if (ENRICHMENT_KEYWORDS[key].some((keyword) => normalized.includes(keyword))) {
      matches.add(key);
    }
  });

  return Array.from(matches);
}

function sanitizeConversationTurns(turns: unknown): ConversationTurn[] {
  if (!Array.isArray(turns)) {
    return [];
  }

  const sanitized = turns
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const question = String((entry as ConversationTurn).question ?? "").trim();
      const answer = String((entry as ConversationTurn).answer ?? "").trim();

      if (!question || !answer) {
        return null;
      }

      return {
        question: question.slice(0, MAX_QUERY_CHARS),
        answer: answer.slice(0, MAX_FOLLOW_UP_CHARS),
      } satisfies ConversationTurn;
    })
    .filter((turn): turn is ConversationTurn => Boolean(turn));

  return sanitized.slice(-MAX_CONVERSATION_TURNS);
}

const SECTION_KEYWORDS: Record<string, string[]> = {
  summary: ["summary", "overview", "bio"],
  education: ["education", "school", "college", "university", "academic"],
  experience: ["experience", "job", "work", "career", "role"],
  projects: ["project", "projects", "side project"],
  skills: ["skill", "skills", "technologies", "tools"],
  achievements: ["achievement", "achievements", "award", "awards", "honor"],
  research: ["research", "paper", "publication"],
};
const SECTION_MATCH_BOOST = 0.15;

const ENRICHMENT_KEYWORDS = {
  skills: [
    "skill",
    "skills",
    "tech stack",
    "technology",
    "technologies",
    "stack",
    "tools",
    "languages",
    "ml",
    "ai",
    "cloud",
  ],
  impact: [
    "impact",
    "result",
    "results",
    "metrics",
    "numbers",
    "outcome",
    "outcomes",
    "revenue",
    "users",
    "scale",
    "growth",
    "performance",
  ],
} as const;

type EnrichmentHint = keyof typeof ENRICHMENT_KEYWORDS;

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i += 1) {
    const ai = a[i];
    const bi = b[i];
    dot += ai * bi;
    magA += ai * ai;
    magB += bi * bi;
  }

  if (!magA || !magB) {
    return 0;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function ensureEmbeddings(client: OpenAI): Promise<number[][]> {
  if (cachedEmbeddings) {
    return cachedEmbeddings;
  }

  const inputs = docs.map((doc) => buildResumeContext(doc));
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: inputs,
  });

  cachedEmbeddings = response.data.map((item) => item.embedding);
  return cachedEmbeddings;
}

type RankedDoc = {
  doc: ResumeDocument;
  embedding: number[];
  similarity: number;
};

function buildContextSection(topDocs: RankedDoc[]): string {
  return topDocs
    .map((entry, index) => {
      const { doc } = entry;
      const chunks: string[] = [
        `Document ${index + 1}:`,
        `Section: ${doc.section}`,
        `Title: ${doc.title}`,
      ];

      if (doc.subtitle) {
        chunks.push(`Subtitle: ${doc.subtitle}`);
      }

      if (doc.content) {
        chunks.push(`Content: ${doc.content}`);
      }

      if (doc.points?.length) {
        chunks.push(`Points:\n- ${doc.points.join("\n- ")}`);
      }

      return chunks.join("\n");
    })
    .join("\n\n");
}

export async function POST(request: NextRequest) {
  try {
    const client = getClient();
    const { query, contextTurns } = (await request.json()) as {
      query?: string;
      contextTurns?: ConversationTurn[];
    };

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: "Query is required." },
        { status: 400 }
      );
    }

    if (query.length > MAX_QUERY_CHARS) {
      return NextResponse.json(
        {
          error: `Query is too long. Please stay under ${MAX_QUERY_CHARS} characters.`,
        },
        { status: 400 }
      );
    }

    const sanitizedTurns = sanitizeConversationTurns(contextTurns);
    const docEmbeddings = await ensureEmbeddings(client);

    const queryEmbeddingResponse = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query,
    });

    const queryEmbedding = queryEmbeddingResponse.data[0]?.embedding ?? [];

    const normalizedQuery = query.toLowerCase();
    const enrichmentHints = detectEnrichments(normalizedQuery);
    const matchedSections = new Set<string>();

    Object.entries(SECTION_KEYWORDS).forEach(([section, keywords]) => {
      if (keywords.some((keyword) => normalizedQuery.includes(keyword))) {
        matchedSections.add(section);
      }
    });

    const rankedDocs: RankedDoc[] = docs
      .map((doc, index) => ({
        doc,
        embedding: docEmbeddings[index],
        similarity:
          cosineSimilarity(queryEmbedding, docEmbeddings[index]) +
          (matchedSections.has(doc.section) ? SECTION_MATCH_BOOST : 0),
      }))
      .filter((entry) => entry.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, MAX_CONTEXT_DOCUMENTS);

    if (!rankedDocs.length) {
      return NextResponse.json({
        answer:
          "I could not find relevant information in the resume. Could you try rephrasing your question?",
        sources: [],
        enrichment: enrichmentHints,
      });
    }

    const context = buildContextSection(rankedDocs);
    const followUpContext = sanitizedTurns.length
      ? `Previous conversation:\n${sanitizedTurns
          .map(
            (turn, index) =>
              `Q${index + 1}: ${turn.question}\nA${index + 1}: ${turn.answer}`
          )
          .join("\n\n")}\n\n`
      : "";

    const response = await client.responses.create({
      model: CHAT_MODEL,
      tools: [{ type: "web_search_preview" }],
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You are an Aryan, and answers questions about you (Aryan). Use only the provided context. Respond concisely and reference specific experiences when helpful. Use bullet points only when listing several related items such as education entries, experience highlights, or project details; otherwise prefer flowing sentences. Keep the tone conversational and blend sourced details naturally so it feels like a dialogue rather than a document dump. Respond to only questions related to you.If someone asks wrong, weird question roast them in same way.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `${followUpContext}Context:\n${context}\n\nQuestion: ${query}`,
            },
          ],
        },
      ],
    });

    const answer = response.output_text?.trim();

    return NextResponse.json({
      answer:
        answer ??
        "I could not generate an answer right now. Please try again shortly.",
      sources: rankedDocs.map(({ doc, similarity }) => ({
        id: doc.id,
        title: doc.title,
        section: doc.section,
        similarity,
      })),
      enrichment: enrichmentHints,
    });
  } catch (error) {
    console.error("Error in agent route:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process your request.",
      },
      { status: 500 }
    );
  }
}
