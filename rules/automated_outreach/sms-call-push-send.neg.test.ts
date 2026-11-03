// lexcode-expect: 0
import Anthropic from '@anthropic-ai/sdk';
import twilio from 'twilio';
import { WebSocket } from 'ws';

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

// A one-time code texted to the number the person just entered.
export async function textLoginCode(phone: string, otp: string) {
  await client.messages.create({ to: phone, from: process.env.TWILIO_FROM, body: `Your login code is ${otp}` });
}

// Twilio Verify: the person asked to sign in by text.
export async function startVerification(phone: string) {
  return client.verify.v2.services(process.env.VERIFY_SID as string).verifications.create({ to: phone, channel: 'sms' });
}

// A model API call. Its `messages.create` is a chat completion, not a text message.
const llm = new Anthropic();
export async function summarize(text: string) {
  return llm.messages.create({ model: 'claude-sonnet-5-5', max_tokens: 300, messages: [{ role: 'user', content: text }] });
}

// A websocket send to the connected browser tab. Not a message to a person off the page.
export function ping(ws: WebSocket) {
  ws.send(JSON.stringify({ type: 'ping' }));
}

// A local helper named like a sender, with no SMS in it.
function sendSmsPreview(text: string) {
  return text.slice(0, 160);
}
console.log(sendSmsPreview('hello'));
