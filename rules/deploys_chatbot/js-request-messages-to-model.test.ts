// lexcode-expect: 6
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { streamText, generateText, convertToModelMessages } from 'ai';
import { openai as aiOpenai } from '@ai-sdk/openai';
import express from 'express';

const openai = new OpenAI();
const anthropic = new Anthropic();
const app = express();

// App Router chat route: the browser sends the whole conversation so far on every turn.
export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: aiOpenai('gpt-4o'),
    system: 'You are the help desk assistant.',
    messages: convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}

// The same route with the history passed straight through.
export async function PUT(req: Request) {
  const { messages } = await req.json();
  const { text } = await generateText({ model: aiOpenai('gpt-4o-mini'), messages });
  return Response.json({ text });
}

// Express route over the chat completions API.
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: 'You are a friendly assistant.' }, ...messages],
  });
  res.json(completion.choices[0].message);
});

// The history held in a body field with another name.
app.post('/api/assistant', async (req, res) => {
  const body = req.body;
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    messages: body.history,
  });
  res.json(msg);
});

// Read straight off the request object.
app.post('/api/support', async (req, res) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: req.body.messages,
  });
  res.json({ reply: completion.choices[0].message.content });
});

// The Responses API takes the running conversation as input.
app.post('/api/respond', async (req, res) => {
  const { conversation } = req.body;
  const out = await openai.responses.create({ model: 'gpt-4.1', input: conversation });
  res.json({ reply: out.output_text });
});
