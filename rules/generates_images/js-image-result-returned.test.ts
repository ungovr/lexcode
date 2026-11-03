// lexcode-expect: 2
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI();

// A helper hands the generated picture to its caller. Where it goes is not visible
// here, so the match is a signal.
export async function renderCover(title: string): Promise<string> {
  const result = await openai.images.generate({ model: 'gpt-image-1', prompt: `Book cover for ${title}` });
  return result.data[0].b64_json ?? '';
}

export const renderIcon = async (name: string) => {
  const result = await openai.images.generate({ model: 'dall-e-3', prompt: `Flat icon of ${name}` });
  const url = result.data[0].url;
  return { name, url };
};

// This one answers the HTTP request itself, so the evidence rule owns it.
export async function POST(request: Request) {
  const { prompt } = await request.json();
  const result = await openai.images.generate({ model: 'gpt-image-1', prompt });
  return NextResponse.json({ image: result.data[0].b64_json });
}
