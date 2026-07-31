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
const MAX_QUERY_CHARS = 4000;

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

async function fetchGithubActivity(): Promise<string> {
  try {
    const res = await fetch(
      "https://api.github.com/users/imaryandokania/repos?sort=pushed&per_page=6",
      { headers: { Accept: "application/vnd.github+json" }, next: { revalidate: 3600 } }
    );
    if (!res.ok) {
      return "GitHub API unavailable right now.";
    }
    const repos = (await res.json()) as Array<{
      name: string;
      description: string | null;
      language: string | null;
      stargazers_count: number;
      pushed_at: string;
      html_url: string;
    }>;
    return repos
      .map(
        (r) =>
          `${r.name} (${r.language ?? "n/a"}, ★${r.stargazers_count}, last push ${r.pushed_at.slice(0, 10)}): ${r.description ?? "no description"} — ${r.html_url}`
      )
      .join("\n");
  } catch {
    return "GitHub API unavailable right now.";
  }
}

const AGENT_TOOLS: OpenAI.Responses.Tool[] = [
  { type: "web_search_preview" },
  {
    type: "function",
    name: "github_activity",
    description:
      "Fetch Aryan's live GitHub repositories with languages, stars, and last-push dates. Use when asked about recent code, open source, or what he is currently building.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
    strict: true,
  },
];

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
    const { query, contextTurns, stream } = (await request.json()) as {
      query?: string;
      contextTurns?: ConversationTurn[];
      stream?: boolean;
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

    const inputMessages: OpenAI.Responses.ResponseInput = [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You are Aryan's AI agent, speaking as Aryan in first person. Use the provided resume context as ground truth. Respond concisely and reference specific experiences when helpful. Prefer flowing sentences; use bullet points only for genuinely list-like content. Keep the tone conversational. Only answer questions related to Aryan; if someone asks something weird, roast them playfully. You have tools: call github_activity for questions about recent code or open-source work. SPECIAL MODES: (1) If the user pastes what looks like a job description, switch to FIT CHECK mode: analyze it requirement by requirement against the resume, output a markdown table mapping each key requirement to concrete evidence (role/project + result), then a verdict line with a fit rating out of 10 and honest gaps. (2) If asked to get in touch, draft a short intro email on the user's behalf and include a mailto:aryandokania2001@gmail.com link with a suitable subject.",
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
      ];

    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            // Agent loop: resolve tool calls (visibly), then stream the final answer.
            let loopInput: OpenAI.Responses.ResponseInput = [...inputMessages];
            for (let hop = 0; hop < 3; hop += 1) {
              const draft = await client.responses.create({
                model: CHAT_MODEL,
                tools: AGENT_TOOLS,
                input: loopInput,
              });

              const functionCalls = draft.output.filter(
                (item): item is OpenAI.Responses.ResponseFunctionToolCall =>
                  item.type === "function_call"
              );

              if (!functionCalls.length) {
                // No tools needed — stream a final answer.
                break;
              }

              loopInput = [...loopInput, ...draft.output];
              for (const call of functionCalls) {
                controller.enqueue(
                  encoder.encode(`\`⚙ ${call.name}()\` — fetching live data…\n\n`)
                );
                let output = "Tool not available.";
                if (call.name === "github_activity") {
                  output = await fetchGithubActivity();
                }
                loopInput.push({
                  type: "function_call_output",
                  call_id: call.call_id,
                  output,
                });
              }
            }

            const streamingResponse = await client.responses.create({
              model: CHAT_MODEL,
              tools: AGENT_TOOLS,
              input: loopInput,
              stream: true,
            });

            for await (const event of streamingResponse) {
              if (event.type === "response.output_text.delta" && event.delta) {
                controller.enqueue(encoder.encode(event.delta));
              }
            }
          } catch (err) {
            console.error("Streaming error:", err);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "x-enrichment": JSON.stringify(enrichmentHints),
        },
      });
    }

    const response = await client.responses.create({
      model: CHAT_MODEL,
      tools: [{ type: "web_search_preview" }],
      input: inputMessages,
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
