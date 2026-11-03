// lexcode-expect: 6
import { createUIMessageStream, createUIMessageStreamResponse, streamText, streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { Request, Response } from 'express';
import { z } from 'zod';

// App Router route: the model's tokens are streamed to the browser.
export async function POST(req: Request) {
  const { prompt } = await req.json();
  const result = streamText({
    model: openai('gpt-4o'),
    system: 'You write short product descriptions.',
    prompt,
  });
  return result.toDataStreamResponse();
}

// The same stream in the newer UI-message format.
export async function PUT(req: Request) {
  const { prompt } = await req.json();
  const result = streamText({ model: openai('gpt-4o'), prompt });
  return result.toUIMessageStreamResponse();
}

// Plain-text stream.
export async function PATCH(req: Request) {
  const { prompt } = await req.json();
  const result = streamText({ model: openai('gpt-4o-mini'), prompt });
  return result.toTextStreamResponse();
}

// A structured stream sent to the client.
export async function GET() {
  const result = streamObject({
    model: openai('gpt-4o'),
    schema: z.object({ title: z.string(), body: z.string() }),
    prompt: 'Draft a short announcement.',
  });
  return result.toTextStreamResponse();
}

// The AI SDK 5 chat route: the model's stream is merged into a UI message stream that is
// sent back as the response.
export async function chatRoute(req: Request) {
  const { messages } = await req.json();
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const result = streamText({ model: openai('gpt-4o'), messages });
      writer.merge(result.toUIMessageStream());
    },
  });
  return createUIMessageStreamResponse({ stream });
}

// Node server: pipe the stream into the HTTP response.
export function expressHandler(req: Request, res: Response) {
  const result = streamText({ model: openai('gpt-4o'), prompt: String(req.query.q) });
  result.pipeDataStreamToResponse(res);
}
