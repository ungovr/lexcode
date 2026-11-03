// lexcode-expect: 3
import readline from 'node:readline/promises';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI();
const anthropic = new Anthropic();

// A terminal chat: every user turn and every model turn goes into one history, and the
// whole history is sent back each time.
export async function terminalChat() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const history: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: 'system', content: 'You are a helpful assistant.' }];
  while (true) {
    const line = await rl.question('you> ');
    history.push({ role: 'user', content: line });
    const reply = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: history });
    const answer = reply.choices[0].message;
    console.log('bot>', answer.content);
    history.push(answer);
  }
}

// A session object that keeps the conversation between calls.
export class Session {
  private turns: Anthropic.MessageParam[] = [];

  async say(text: string): Promise<string> {
    this.turns.push({ role: 'user', content: text });
    const msg = await anthropic.messages.create({ model: 'claude-sonnet-4-5', max_tokens: 1024, messages: this.turns });
    const out = msg.content[0].type === 'text' ? msg.content[0].text : '';
    this.turns.push({ role: 'assistant', content: out });
    return out;
  }
}

// Server-side memory keyed by conversation id.
const conversations = new Map<string, any[]>();

export async function turn(id: string, text: string) {
  const messages = conversations.get(id) ?? [];
  messages.push({ role: 'user', content: text });
  const r = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages });
  messages.push({ role: 'assistant', content: r.choices[0].message.content });
  conversations.set(id, messages);
  return r.choices[0].message.content;
}
