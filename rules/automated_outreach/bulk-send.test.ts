// lexcode-expect: 5
import sgMail from '@sendgrid/mail';
import { Expo } from 'expo-server-sdk';
import { ServerClient } from 'postmark';
import admin from 'firebase-admin';

const expo = new Expo();
const postmark = new ServerClient(process.env.POSTMARK_TOKEN as string);

// One call, many recipients: the provider fans the message out.
export async function announce(emails: string[]) {
  await sgMail.sendMultiple({ to: emails, from: 'news@example.org', subject: 'Service change', text: 'Buses on route 12 now stop at the library.' });
}

export async function pushAll(tokens: string[]) {
  const messages = tokens.map((to) => ({ to, sound: 'default' as const, body: 'A new report was published' }));
  for (const chunk of expo.chunkPushNotifications(messages)) {
    await expo.sendPushNotificationsAsync(chunk);
  }
}

export async function batchMail(rows: { email: string; subject: string }[]) {
  await postmark.sendEmailBatch(rows.map((r) => ({ From: 'hi@example.org', To: r.email, Subject: r.subject, TextBody: 'Hello' })));
}

export async function multicast(tokens: string[]) {
  await admin.messaging().sendEachForMulticast({ tokens, notification: { title: 'Pickup moved', body: 'See the schedule' } });
}

export async function topic() {
  await admin.messaging().sendToTopic('city-alerts', { notification: { title: 'Boil water notice' } });
}
