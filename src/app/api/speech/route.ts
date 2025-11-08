import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const SPEECH_MODEL = 'gpt-4o-mini-tts';
const SPEECH_VOICE = 'onyx';
const SPEECH_CHAR_LIMIT = 650;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable.');
  }

  return new OpenAI({ apiKey });
}

function clampSpeechText(text: string): { output: string; shortened: boolean } {
  if (text.length <= SPEECH_CHAR_LIMIT) {
    return { output: text, shortened: false };
  }

  const clipped = text.slice(0, SPEECH_CHAR_LIMIT);
  const lastSentence =
    Math.max(clipped.lastIndexOf('. '), clipped.lastIndexOf('! '), clipped.lastIndexOf('? ')) + 1;
  const safeLength = lastSentence > SPEECH_CHAR_LIMIT * 0.6 ? lastSentence : clipped.length;
  const trimmed = clipped.slice(0, safeLength).trim();

  return { output: `${trimmed}${trimmed.endsWith('…') ? '' : ' …'}`, shortened: true };
}

export async function POST(request: NextRequest) {
  try {
    const { text } = (await request.json()) as { text?: string };
    const trimmed = text?.trim();

    if (!trimmed) {
      return NextResponse.json({ error: 'Text is required for speech synthesis.' }, { status: 400 });
    }

    const client = getClient();
    const { output } = clampSpeechText(trimmed);
    const speech = await client.audio.speech.create({
      model: SPEECH_MODEL,
      voice: SPEECH_VOICE,
      input: output
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Speech synthesis failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to synthesize speech.'
      },
      { status: 500 }
    );
  }
}
