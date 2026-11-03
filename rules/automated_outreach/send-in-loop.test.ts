// lexcode-expect: 10
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import webpush from 'web-push';
import { db } from './db';
import { sendEmail } from './mailer';

const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: 587 });
const resend = new Resend(process.env.RESEND_API_KEY);
const sms = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const ses = new SESClient({ region: 'us-west-2' });

// A monthly newsletter, one message per subscriber.
export async function sendNewsletter(subscribers: { email: string; name: string }[]) {
  for (const sub of subscribers) {
    await transporter.sendMail({ from: 'news@example.org', to: sub.email, subject: 'This month', html: `<p>Hi ${sub.name}</p>` });
  }
}

export async function sendViaResend(users: { email: string }[]) {
  await Promise.all(users.map((u) => resend.emails.send({ from: 'hi@example.org', to: u.email, subject: 'Hello', html: '<p>Hello</p>' })));
}

export async function sendViaSendgrid(users: { email: string }[]) {
  for (const u of users) {
    await sgMail.send({ to: u.email, from: 'hi@example.org', subject: 'Update', text: 'There is an update.' });
  }
}

export async function textEveryone(phones: string[]) {
  for (const phone of phones) {
    await sms.messages.create({ to: phone, from: process.env.TWILIO_FROM, body: 'Your trash pickup moves to Tuesday.' });
  }
}

export async function viaSes(addresses: string[]) {
  for (const address of addresses) {
    await ses.send(new SendEmailCommand({ Source: 'hi@example.org', Destination: { ToAddresses: [address] }, Message: { Subject: { Data: 'Hi' }, Body: { Text: { Data: 'Hi' } } } }));
  }
}

export async function pushToSubscribers(subs: webpush.PushSubscription[]) {
  for (const s of subs) {
    await webpush.sendNotification(s, JSON.stringify({ title: 'New report published' }));
  }
}

export async function helperLoop() {
  const users = await db.users.findMany({ where: { optedIn: true } });
  for (const user of users) {
    await sendEmail(user.email, 'Your weekly summary');
  }
  users.forEach(async (user) => {
    await sendEmail(user.email, 'Reminder');
  });
}

export async function indexed(users: { email: string }[]) {
  for (let i = 0; i < users.length; i++) {
    await transporter.sendMail({ from: 'hi@example.org', to: users[i].email, subject: 'Notice' });
  }
}

export async function viaApi(recipients: string[]) {
  for (const r of recipients) {
    await fetch('https://api.resend.com/emails', { method: 'POST', body: JSON.stringify({ to: r, from: 'hi@example.org', subject: 'Hi' }) });
  }
}
