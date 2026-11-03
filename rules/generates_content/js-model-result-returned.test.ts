// lexcode-expect: 3
import { ChatOpenAI } from '@langchain/openai';
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const model = new ChatOpenAI({ model: 'gpt-4o-mini' });
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Service functions hand the model's output to their caller. Where it goes is not
// visible here, so the match is a signal.
export async function explain(term: string) {
  const out = await model.invoke(`Explain ${term} simply.`);
  return out.content;
}

export const summarizeThread = async (thread: string) => {
  const response = await genai.models.generateContent({ model: 'gemini-2.5-flash', contents: thread });
  return response.text;
};

export async function classify(note: string) {
  const reply = await model.invoke(`One word label for: ${note}`);
  return { note, label: String(reply.content).trim() };
}

// This route answers the HTTP request itself, so the evidence rule owns it.
export async function POST(request: Request) {
  const { question } = await request.json();
  const out = await model.invoke(question);
  return NextResponse.json({ answer: out.content });
}
