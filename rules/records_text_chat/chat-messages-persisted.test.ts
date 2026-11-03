// lexcode-expect: 4
// Chat route handlers that keep the conversation: the messages in the request
// are written to a database before or after the assistant answers.
import { streamText } from 'ai';
import { db } from '@/db';
import { chatMessages } from '@/db/schema';
import { prisma } from '@/lib/prisma';
import { Conversation } from '@/models/conversation';
import { saveChat, saveMessages } from '@/db/queries';

export async function POST(req: Request) {
  const { messages, id } = await req.json();
  const result = streamText({ model: 'gpt-4o', messages });
  await db.insert(chatMessages).values(messages.map((m: any) => ({ chatId: id, role: m.role, content: m.content })));
  return result.toDataStreamResponse();
}

export async function PUT(req: Request) {
  const body = await req.json();
  await prisma.chatMessage.createMany({ data: body.messages });
  await saveMessages({ messages: body.messages });
  return Response.json({ ok: true });
}

app.post('/api/chat', async (req, res) => {
  const history = req.body.messages;
  await Conversation.create({ userId: req.user.id, transcript: JSON.stringify(history) });
  res.json({ ok: true });
});
