// lexcode-expect: 4
import twilio from 'twilio';
import webpush from 'web-push';
import admin from 'firebase-admin';

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

export async function textStatus(phone: string, status: string) {
  // Tells the person their request moved; they did not just ask for this message.
  await client.messages.create({ to: phone, from: process.env.TWILIO_FROM, body: `Your request is now ${status}.` });
}

export async function callBack(phone: string) {
  await client.calls.create({ to: phone, from: process.env.TWILIO_FROM, url: 'https://example.org/voice/outbound.xml' });
}

export async function push(sub: webpush.PushSubscription) {
  await webpush.sendNotification(sub, JSON.stringify({ title: 'New message' }));
}

export async function fcm(token: string) {
  await admin.messaging().send({ token, notification: { title: 'Your report is ready' } });
}
