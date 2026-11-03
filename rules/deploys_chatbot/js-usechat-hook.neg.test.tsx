// lexcode-expect: 0
'use client';

// Interfaces and routes with no conversation: a form that sends one text, a local hook that
// shares a name with the AI SDK's, a static FAQ, and single-shot model calls.
import { useState } from 'react';
import { useChat } from './hooks/useChat';
import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import OpenAI from 'openai';
import type { NextRequest } from 'next/server';

const client = new OpenAI();

// A local hook: it lists human-to-human messages from our own backend.
export function InboxPreview() {
  const { unread } = useChat('inbox');
  return <span>{unread} new</span>;
}

// A summarizer form: one text in, one summary out, nothing remembered between uses.
export function SummarizeForm() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  async function run() {
    const res = await fetch('/api/summarize', { method: 'POST', body: JSON.stringify({ text }) });
    setSummary((await res.json()).summary);
  }
  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={run}>Summarize</button>
      <p>{summary}</p>
    </div>
  );
}

// A static FAQ with no back-and-forth exchange.
export function Faq() {
  return (
    <dl>
      <dt>How do I reset my password?</dt>
      <dd>Use the link on the sign-in page.</dd>
    </dl>
  );
}

// The summarize route: the request carries one text, the model call has a fixed two-turn prompt.
export async function POST(req: NextRequest) {
  const { text } = await req.json();
  const { text: summary } = await generateText({
    model: openai('gpt-4o-mini'),
    messages: [
      { role: 'system', content: 'Summarize the text in one paragraph.' },
      { role: 'user', content: text },
    ],
  });
  return Response.json({ summary });
}

// A classifier route: the request names a document, the prompt is built here.
export async function PUT(req: NextRequest) {
  const { docId } = await req.json();
  const result = streamText({ model: openai('gpt-4o-mini'), prompt: `Classify document ${docId}` });
  return result.toTextStreamResponse();
}

// A batch job: each document gets its own call, and no reply is fed back.
export async function labelAll(docs: string[]) {
  const labels: string[] = [];
  for (const doc of docs) {
    const messages = [{ role: 'user' as const, content: `One word label for: ${doc}` }];
    const r = await client.chat.completions.create({ model: 'gpt-4o-mini', messages });
    labels.push(r.choices[0].message.content ?? '');
  }
  return labels;
}
