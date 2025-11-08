import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const TRANSCRIBE_MODEL = 'gpt-4o-mini-transcribe';

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable.');
  }

  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio');

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: 'Audio file is required.' }, { status: 400 });
    }

    const client = getClient();
    const fileBuffer = Buffer.from(await audio.arrayBuffer());
    const file = await OpenAI.toFile(fileBuffer, audio.name || 'speech.webm');

    const transcription = await client.audio.transcriptions.create({
      model: TRANSCRIBE_MODEL,
      file,
      response_format: 'json'
    });

    return NextResponse.json({
      transcript: transcription.text?.trim() ?? ''
    });
  } catch (error) {
    console.error('Voice transcription failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to transcribe audio.'
      },
      { status: 500 }
    );
  }
}
