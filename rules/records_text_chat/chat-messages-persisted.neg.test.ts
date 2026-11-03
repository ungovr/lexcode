// lexcode-expect: 0
// A chat endpoint that keeps no history and sends nothing to a chat vendor, and a
// contact form that is saved to a table. Neither keeps a conversation.
import OpenAI from 'openai';
import { db } from '@/db';
import { contactRequests } from '@/db/schema';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI();

export async function POST(req: Request) {
  // Answers the turn and forgets it: the messages go to the model and back to the caller.
  const { messages } = await req.json();
  const reply = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages });
  return Response.json({ reply: reply.choices[0].message });
}

export async function contact(req: Request) {
  const { email, subject, message } = await req.json();
  await db.insert(contactRequests).values({ email, subject, message });
  return Response.json({ received: true });
}

app.post('/api/feedback', async (req, res) => {
  const { rating, comment } = req.body;
  await prisma.feedback.create({ data: { rating, comment } });
  res.json({ ok: true });
});

app.post('/api/usage', async (req, res) => {
  // Meters how many turns were sent; the text of the turns is not stored.
  const messages = req.body.messages;
  await prisma.usage.create({ data: { userId: req.user.id, turns: messages.length } });
  res.json({ ok: true });
});

app.post('/api/summarize', async (req, res) => {
  const messages = req.body.messages;
  const text = messages.map((m) => m.content).join('\n');
  res.json({ words: text.split(/\s+/).length });
});
