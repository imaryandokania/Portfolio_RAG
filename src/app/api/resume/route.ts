import { NextResponse } from "next/server";
import { resumeData } from "../../../data/resumeData";

// Public resume API — machine-readable resume.
// GET /api/resume

export async function GET() {
  return NextResponse.json(
    {
      meta: {
        format: "aryan-resume/v1",
        source: "https://aryandokania.vercel.app",
        docs: "GET /api/resume — full resume as JSON. Interactive version with RAG search at the source URL.",
        updated: "2026-07"
      },
      resume: resumeData
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600, s-maxage=3600"
      }
    }
  );
}
