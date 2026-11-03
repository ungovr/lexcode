// lexcode-expect: 4
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { NextResponse } from 'next/server';
import express from 'express';

const app = express();
const model = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0.3 });
const claude = new ChatAnthropic({ model: 'claude-sonnet-4-5' });

// Next.js route: the chain's answer is returned to the caller.
export async function POST(request: Request) {
  const { question } = await request.json();
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'Answer in two sentences.'],
    ['human', '{question}'],
  ]);
  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  const answer = await chain.invoke({ question });
  return NextResponse.json({ answer });
}

// Express route that calls the model directly.
app.post('/api/explain', async (req, res) => {
  const out = await claude.invoke([{ role: 'user', content: `Explain simply: ${req.body.term}` }]);
  res.json({ explanation: out.content });
});

// Streaming the chunks back.
app.get('/api/stream', async (req, res) => {
  const stream = await model.stream(`Write a limerick about ${req.query.topic}`);
  for await (const chunk of stream) {
    res.write(chunk.content);
  }
  res.end();
});

// A model built inside the handler.
app.post('/api/title', async (req, res) => {
  const local = new ChatOpenAI({ model: 'gpt-4o-mini' });
  const reply = await local.invoke(`Suggest a title for: ${req.body.text}`);
  res.send(reply.content);
});
