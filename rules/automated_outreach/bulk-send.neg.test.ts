// lexcode-expect: 0
import { Expo } from 'expo-server-sdk';
import { db } from './db';

// Splits tokens into chunks and validates them without sending anything.
const expo = new Expo();
export function validTokens(tokens: string[]) {
  return tokens.filter((t) => Expo.isExpoPushToken(t));
}

export function chunks(messages: { to: string; body: string }[]) {
  return expo.chunkPushNotifications(messages);
}

// An in-process event bus with methods that happen to be named like batch senders.
class EventBus {
  private handlers: Array<(e: string) => void> = [];
  sendEach(events: string[]) {
    for (const e of events) this.handlers.forEach((h) => h(e));
  }
  sendMulticast(e: string) {
    this.handlers.forEach((h) => h(e));
  }
  on(h: (e: string) => void) {
    this.handlers.push(h);
  }
}

const bus = new EventBus();
bus.on((e) => console.log(e));
bus.sendEach(['a', 'b']);
bus.sendMulticast('c');

// A bulk database write, not a message.
export async function importRows(rows: { name: string }[]) {
  await db.items.createMany({ data: rows });
}
