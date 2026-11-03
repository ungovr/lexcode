// lexcode-expect: 0
// Request handlers that save something named for a form, a vote or a setting, and
// a chat answered without saving it. None of them keeps a conversation.
import { saveContactMessage, saveVote, saveSettings } from '@/lib/db/queries';
import { streamText } from 'ai';

export async function contact(request: Request) {
  const body = await request.json();
  await saveContactMessage({ email: body.email, text: body.message });
  return Response.json({ received: true });
}

export async function vote(request: Request) {
  const { chatId, messageId, type } = await request.json();
  await saveVote({ chatId, messageId, type });
  return Response.json({ ok: true });
}

export async function settings(request: Request) {
  const body = await request.json();
  await saveSettings(body);
  return Response.json({ ok: true });
}

export async function answer(request: Request) {
  const { messages } = await request.json();
  const result = streamText({ model: 'gpt-4o-mini', messages });
  return result.toDataStreamResponse();
}
