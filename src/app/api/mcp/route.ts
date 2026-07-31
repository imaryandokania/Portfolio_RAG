import { NextRequest, NextResponse } from "next/server";
import { resumeData } from "../../../data/resumeData";

// Minimal MCP (Model Context Protocol) server over streamable HTTP.
// Add this portfolio as a tool source in Claude, Copilot Studio, or any MCP client:
//   URL: https://aryandokania.vercel.app/api/mcp
// Exposes: ask_aryan (RAG agent), get_resume (structured JSON).

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: number | string | null;
  method: string;
  params?: Record<string, unknown>;
};

const SERVER_INFO = {
  name: "aryan-portfolio",
  version: "1.0.0"
};

const TOOLS = [
  {
    name: "ask_aryan",
    description:
      "Ask Aryan Dokania's AI agent anything about his experience, projects, research, or skills. Powered by RAG over his resume.",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "The question to ask" }
      },
      required: ["question"]
    }
  },
  {
    name: "get_resume",
    description:
      "Get Aryan Dokania's full resume as structured JSON (experience, projects, research, skills, education).",
    inputSchema: { type: "object", properties: {} }
  }
];

function rpcResult(id: JsonRpcRequest["id"], result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result });
}

function rpcError(id: JsonRpcRequest["id"], code: number, message: string) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
}

export async function POST(request: NextRequest) {
  let body: JsonRpcRequest;
  try {
    body = (await request.json()) as JsonRpcRequest;
  } catch {
    return rpcError(null, -32700, "Parse error");
  }

  const { id, method, params } = body;

  switch (method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO
      });

    case "notifications/initialized":
      return new NextResponse(null, { status: 202 });

    case "ping":
      return rpcResult(id, {});

    case "tools/list":
      return rpcResult(id, { tools: TOOLS });

    case "tools/call": {
      const toolName = (params?.name as string) ?? "";
      const args = (params?.arguments as Record<string, unknown>) ?? {};

      if (toolName === "get_resume") {
        return rpcResult(id, {
          content: [{ type: "text", text: JSON.stringify(resumeData, null, 2) }]
        });
      }

      if (toolName === "ask_aryan") {
        const question = String(args.question ?? "").trim();
        if (!question) {
          return rpcError(id, -32602, "question is required");
        }
        try {
          const origin = request.nextUrl.origin;
          const res = await fetch(`${origin}/api/agent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: question })
          });
          const payload = (await res.json()) as { answer?: string; error?: string };
          if (!res.ok) {
            throw new Error(payload.error ?? "agent failed");
          }
          return rpcResult(id, {
            content: [{ type: "text", text: payload.answer ?? "No answer." }]
          });
        } catch (err) {
          return rpcResult(id, {
            content: [
              {
                type: "text",
                text: `Agent unavailable: ${err instanceof Error ? err.message : "unknown error"}`
              }
            ],
            isError: true
          });
        }
      }

      return rpcError(id, -32602, `Unknown tool: ${toolName}`);
    }

    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

export async function GET() {
  return NextResponse.json({
    ...SERVER_INFO,
    protocol: "MCP over streamable HTTP (POST JSON-RPC to this endpoint)",
    tools: TOOLS.map((t) => t.name),
    hint: "Add this URL as an MCP server in Claude, Copilot Studio, or any MCP client."
  });
}
