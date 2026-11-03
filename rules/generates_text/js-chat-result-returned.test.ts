// lexcode-expect: 3
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const openai = new OpenAI();
const anthropic = new Anthropic();

// A service function hands the model's text to whatever calls it. Where that goes
// is not visible here, so the match is a signal.
export async function summarize(text: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: `Summarize:\n${text}` }],
  });
  return completion.choices[0].message.content ?? '';
}

export const draftReply = async (email: string) => {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 600,
    messages: [{ role: 'user', content: `Draft a polite reply to:\n${email}` }],
  });
  return msg.content;
};

export async function describeProduct(name: string) {
  const out = await openai.responses.create({ model: 'gpt-4.1', input: `Describe ${name} in two sentences.` });
  const description = out.output_text.trim();
  return { name, description };
}

// This one answers the HTTP request itself, so the evidence rule owns it and the
// signal rule stays quiet.
export async function POST(request: Request) {
  const { topic } = await request.json();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: `Write a tagline for ${topic}` }],
  });
  return NextResponse.json({ tagline: completion.choices[0].message.content });
}
