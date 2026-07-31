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
  brain: ["why", "opinion", "think", "story", "hardest", "yourself", "hobby", "person", "like", "who are you"],
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

async function redisCmd(cmd: (string | number)[]): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(cmd.map(String)),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: unknown };
    return data.result ?? null;
  } catch {
    return null;
  }
}

function sanitizeSessionId(raw: unknown): string | null {
  const value = String(raw ?? "");
  return /^[a-zA-Z0-9-]{8,64}$/.test(value) ? value : null;
}

async function loadVisitorNotes(sessionId: string | null): Promise<string[]> {
  if (!sessionId) return [];
  const result = await redisCmd(["LRANGE", `portfolio:profile:${sessionId}`, 0, 19]);
  return Array.isArray(result) ? (result as string[]) : [];
}

async function saveVisitorNote(sessionId: string | null, note: string): Promise<boolean> {
  if (!sessionId || !note.trim()) return false;
  const key = `portfolio:profile:${sessionId}`;
  const ok = await redisCmd(["RPUSH", key, note.slice(0, 300)]);
  await redisCmd(["LTRIM", key, -20, -1]);
  await redisCmd(["EXPIRE", key, 60 * 60 * 24 * 90]);
  return ok !== null;
}

async function loadServerTurns(sessionId: string | null): Promise<ConversationTurn[]> {
  if (!sessionId) return [];
  const result = await redisCmd(["LRANGE", `portfolio:convo:${sessionId}`, -6, -1]);
  if (!Array.isArray(result)) return [];
  return (result as string[])
    .map((raw) => {
      try {
        return JSON.parse(raw) as ConversationTurn;
      } catch {
        return null;
      }
    })
    .filter((t): t is ConversationTurn => Boolean(t?.question && t?.answer));
}

async function saveServerTurn(sessionId: string | null, question: string, answer: string): Promise<void> {
  if (!sessionId || !answer.trim()) return;
  const key = `portfolio:convo:${sessionId}`;
  await redisCmd([
    "RPUSH",
    key,
    JSON.stringify({ question: question.slice(0, 500), answer: answer.slice(0, 1500) }),
  ]);
  await redisCmd(["LTRIM", key, -10, -1]);
  await redisCmd(["EXPIRE", key, 60 * 60 * 24 * 90]);
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

async function storeVisitorMessage(args: {
  name?: string;
  contact?: string;
  message?: string;
}): Promise<string> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return "Message storage is not configured — ask them to email aryandokania2001@gmail.com directly instead.";
  }
  try {
    const entry = JSON.stringify({
      name: String(args.name ?? "anonymous").slice(0, 500),
      contact: String(args.contact ?? "not provided").slice(0, 500),
      message: String(args.message ?? "").slice(0, 1000),
      at: new Date().toISOString(),
    });
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["LPUSH", "portfolio:messages", entry]),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`upstash ${res.status}`);
    return "Message stored successfully. Aryan will see it.";
  } catch {
    return "Storing failed — suggest emailing aryandokania2001@gmail.com directly.";
  }
}

async function executeTool(
  client: OpenAI,
  sessionId: string | null,
  name: string,
  rawArgs: string
): Promise<string> {
  let args: Record<string, string> = {};
  try {
    args = JSON.parse(rawArgs || "{}") as Record<string, string>;
  } catch {
    // fall through with empty args
  }
  if (name === "github_activity") {
    return fetchGithubActivity();
  }
  if (name === "leave_message") {
    return storeVisitorMessage(args);
  }
  if (name === "search_resume") {
    const q = String(args.query ?? "").trim();
    if (!q) return "search_resume requires a query string.";
    const results = await searchResume(client, q, 4);
    return results.length
      ? buildContextSection(results)
      : "No matching documents found for that query.";
  }
  if (name === "remember_visitor") {
    const note = String(args.note ?? "").trim();
    if (!note) return "remember_visitor requires a note.";
    const ok = await saveVisitorNote(sessionId, note);
    return ok
      ? "Noted — I'll remember that about this visitor for future conversations."
      : "Memory is unavailable right now; continue without saving.";
  }
  return "Tool not available.";
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
  {
    type: "function",
    name: "search_resume",
    description:
      "Search Aryan's resume and personal knowledge base with a free-text query. Call whenever you need more detail than the provided context — e.g. follow-up questions, specific roles, papers, or stories. You may call it multiple times with refined queries.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to search for" },
      },
      required: ["query"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function",
    name: "remember_visitor",
    description:
      "Persist one short fact about the current visitor (their name, company, role, what they're looking for). Call when the visitor shares who they are. These notes are shown to you in future conversations with the same visitor.",
    parameters: {
      type: "object",
      properties: {
        note: { type: "string", description: "One concise fact about the visitor" },
      },
      required: ["note"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function",
    name: "leave_message",
    description:
      "Deliver a message from the visitor to Aryan. Use ONLY after the visitor has provided their message and ideally their name and a way to reach them back. Confirm to the visitor once stored.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Visitor's name" },
        contact: { type: "string", description: "Email, LinkedIn, or other way to reach the visitor" },
        message: { type: "string", description: "The message for Aryan" },
      },
      required: ["name", "contact", "message"],
      additionalProperties: false,
    },
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

async function searchResume(
  client: OpenAI,
  query: string,
  max = MAX_CONTEXT_DOCUMENTS
): Promise<RankedDoc[]> {
  const docEmbeddings = await ensureEmbeddings(client);
  const queryEmbeddingResponse = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  });
  const queryEmbedding = queryEmbeddingResponse.data[0]?.embedding ?? [];
  const normalizedQuery = query.toLowerCase();
  const matchedSections = new Set<string>();
  Object.entries(SECTION_KEYWORDS).forEach(([section, keywords]) => {
    if (keywords.some((keyword) => normalizedQuery.includes(keyword))) {
      matchedSections.add(section);
    }
  });
  return docs
    .map((doc, index) => ({
      doc,
      embedding: docEmbeddings[index],
      similarity:
        cosineSimilarity(queryEmbedding, docEmbeddings[index]) +
        (matchedSections.has(doc.section) ? SECTION_MATCH_BOOST : 0),
    }))
    .filter((entry) => entry.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, max);
}

export async function POST(request: NextRequest) {
  try {
    const client = getClient();
    const { query, contextTurns, stream, sessionId: rawSessionId } = (await request.json()) as {
      query?: string;
      contextTurns?: ConversationTurn[];
      stream?: boolean;
      sessionId?: string;
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

    const sessionId = sanitizeSessionId(rawSessionId);
    const enrichmentHints = detectEnrichments(query.toLowerCase());

    // memory: server-side conversation + remembered visitor facts
    const [serverTurns, visitorNotes, rankedDocs] = await Promise.all([
      loadServerTurns(sessionId),
      loadVisitorNotes(sessionId),
      searchResume(client, query),
    ]);

    const sanitizedTurns = serverTurns.length
      ? serverTurns.slice(-MAX_CONVERSATION_TURNS)
      : sanitizeConversationTurns(contextTurns);

    const context = rankedDocs.length
      ? buildContextSection(rankedDocs)
      : "No pre-fetched context matched — use the search_resume tool to find what you need.";
    const profileContext = visitorNotes.length
      ? `\n\nVisitor profile (facts you remembered from earlier conversations with this visitor):\n- ${visitorNotes.join("\n- ")}`
      : "";
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
              text: `You are Aryan's autonomous AI agent, speaking as Aryan in first person. Use the provided context (resume + personal knowledge base) as ground truth; when a 'brain' document is relevant, prefer its first-person voice over dry resume bullets. Respond concisely and conversationally; bullet points only for genuinely list-like content. Only answer questions related to Aryan; roast weird questions playfully.

AGENT BEHAVIOR: Think in steps. If the pre-fetched context doesn't fully answer the question, call search_resume with refined queries (you may call it several times). Call github_activity for questions about recent code. When a visitor tells you who they are (name, company, role, intent), call remember_visitor with one concise fact so you recognize them next time — and greet returning visitors using their profile naturally, without being creepy about it.

SPECIAL MODES: (1) Job description pasted → FIT CHECK: analyze requirement by requirement, output a markdown table mapping each key requirement to concrete evidence (role/project + result), then a verdict with a fit rating out of 10 and honest gaps. (2) Asked to get in touch → draft a short intro email and include a mailto:aryandokania2001@gmail.com link. (3) Visitor wants to LEAVE A MESSAGE → collect name, contact, and message (ask for anything missing), then call leave_message and confirm.${profileContext}`,
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
            for (let hop = 0; hop < 5; hop += 1) {
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
                const notice =
                  call.name === "leave_message"
                    ? "delivering your message…"
                    : call.name === "search_resume"
                      ? "searching my knowledge base…"
                      : call.name === "remember_visitor"
                        ? "noting that down…"
                        : "fetching live data…";
                controller.enqueue(
                  encoder.encode(`\`⚙ ${call.name}()\` — ${notice}\n\n`)
                );
                const output = await executeTool(client, sessionId, call.name, call.arguments);
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

            let finalAnswer = "";
            for await (const event of streamingResponse) {
              if (event.type === "response.output_text.delta" && event.delta) {
                finalAnswer += event.delta;
                controller.enqueue(encoder.encode(event.delta));
              }
            }
            await saveServerTurn(sessionId, query, finalAnswer);
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

    let finalInput: OpenAI.Responses.ResponseInput = [...inputMessages];
    let response = await client.responses.create({
      model: CHAT_MODEL,
      tools: AGENT_TOOLS,
      input: finalInput,
    });

    for (let hop = 0; hop < 5; hop += 1) {
      const functionCalls = response.output.filter(
        (item): item is OpenAI.Responses.ResponseFunctionToolCall =>
          item.type === "function_call"
      );
      if (!functionCalls.length) {
        break;
      }
      finalInput = [...finalInput, ...response.output];
      for (const call of functionCalls) {
        finalInput.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: await executeTool(client, sessionId, call.name, call.arguments),
        });
      }
      response = await client.responses.create({
        model: CHAT_MODEL,
        tools: AGENT_TOOLS,
        input: finalInput,
      });
    }

    const answer = response.output_text?.trim();
    if (answer) {
      await saveServerTurn(sessionId, query, answer);
    }

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
