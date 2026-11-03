// lexcode-expect: 3
// A chat route that parses its request and hands the chat or its messages to a
// saver named for the conversation.
import { z } from 'zod';
import { saveChat, saveMessages, appendTranscript } from '@/lib/db/queries';

const bodySchema = z.object({
  id: z.string(),
  message: z.object({ id: z.string(), role: z.string(), parts: z.array(z.any()) }),
});

export async function POST(request: Request) {
  const json = await request.json();
  const body = bodySchema.parse(json);
  const { id, message } = body;

  await saveChat({ id, userId: 'u1', title: 'New chat' });
  await saveMessages({ messages: [{ chatId: id, role: message.role, parts: message.parts }] });
  return Response.json({ ok: true });
}

app.post('/chat/:id', async (req, res) => {
  await appendTranscript(req.params.id, req.body.turns);
  res.json({ ok: true });
});
