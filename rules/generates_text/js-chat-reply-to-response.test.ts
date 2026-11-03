// lexcode-expect: 8
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { generateText } from 'ai';
import { openai as aiOpenai } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';
import express from 'express';
import Koa from 'koa';
import Fastify from 'fastify';

const openai = new OpenAI();
const anthropic = new Anthropic();
const app = express();
const fastify = Fastify();

// Next.js route: the summary a chat model writes goes straight back to the caller.
export async function POST(request: Request) {
  const { article } = await request.json();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: `Summarize this article:\n${article}` }],
  });
  const summary = completion.choices[0].message.content;
  return NextResponse.json({ summary });
}

// Express route over the Anthropic Messages API.
app.post('/api/rewrite', async (req, res) => {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Rewrite for a general audience: ' + req.body.text }],
  });
  const block = msg.content[0];
  res.json({ rewritten: block.type === 'text' ? block.text : '' });
});

// Express route over the Responses API, with a status call in the chain.
app.get('/api/headline', async (req, res) => {
  const out = await openai.responses.create({ model: 'gpt-4.1', input: 'Write a headline about ' + req.query.topic });
  res.status(200).send(out.output_text);
});

// Vercel AI SDK, non-streaming, in a Web-standard route.
export async function GET(request: Request) {
  const { text } = await generateText({ model: aiOpenai('gpt-4o'), prompt: 'Write a haiku about autumn.' });
  return new Response(text, { headers: { 'content-type': 'text/plain' } });
}

// Koa
const koa = new Koa();
koa.use(async (ctx) => {
  const r = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: ctx.query.q as string }],
  });
  ctx.body = r.choices[0].message.content;
});

// Fastify
fastify.post('/draft', async (request, reply) => {
  const r = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Draft a reply to: ' + (request.body as any).email }],
  });
  reply.send({ draft: r.choices[0].message.content });
});

// A socket that pushes the model's answer to the visitor's browser.
export function attach(ws: any) {
  ws.on('message', async (raw: Buffer) => {
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: raw.toString() }],
    });
    ws.send(r.choices[0].message.content);
  });
}

// Hono-style context
export async function honoHandler(c: any) {
  const r = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 400,
    messages: [{ role: 'user', content: await c.req.text() }],
  });
  return c.json({ text: r.content });
}
