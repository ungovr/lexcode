// lexcode-expect: 0
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { db } from './db';
import { randomBytes } from 'node:crypto';

const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST });
const resend = new Resend(process.env.RESEND_API_KEY);
const sms = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

// A reply to the person's own immediate request: a password reset they asked for.
export async function requestPasswordReset(req: { body: { email: string } }) {
  const user = await db.users.findByEmail(req.body.email);
  if (!user) return;
  const token = randomBytes(32).toString('hex');
  await db.resetTokens.create({ userId: user.id, token });
  await transporter.sendMail({ to: user.email, subject: 'Reset your password', text: `https://example.org/reset?token=${token}` });
}

// A magic sign-in link the person asked for.
export async function sendMagicLink(email: string) {
  const link = `https://example.org/login?t=${randomBytes(16).toString('hex')}`;
  await resend.emails.send({ from: 'login@example.org', to: email, subject: 'Your sign-in link', html: `<a href="${link}">Sign in</a>` });
}

// Verification of the address they just entered.
export async function verifyEmailAddress(email: string, token: string) {
  await sgMail.send({ to: email, from: 'hi@example.org', subject: 'Confirm your email address', text: `https://example.org/verify?token=${token}` });
}

// A receipt for the form they just submitted.
export async function formReceipt(form: { email: string; reference: string }) {
  await transporter.sendMail({ to: form.email, subject: `We received your request ${form.reference}`, text: 'Thanks. We will be in touch.' });
}

// A one-time code texted to the number they just entered.
export async function textLoginCode(phone: string, otp: string) {
  await sms.messages.create({ to: phone, from: process.env.TWILIO_FROM, body: `Your login code is ${otp}` });
}

// Retry loops around ONE message to ONE person: these are not a loop over recipients.
export async function sendWithRetry(to: string, subject: string, text: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await transporter.sendMail({ to, subject, text });
      return;
    } catch (err) {
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
}

export async function sendUntilAccepted(to: string) {
  let ok = false;
  while (!ok) {
    try {
      await resend.emails.send({ from: 'hi@example.org', to, subject: 'Reset your password', html: '<p>Reset</p>' });
      ok = true;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

// A fallback loop over mail relays: ONE message to ONE person, whichever relay accepts it.
export async function deliverViaFirstRelay(relays: string[], to: string) {
  for (const relay of relays) {
    try {
      const t = nodemailer.createTransport({ host: relay, port: 587 });
      await t.sendMail({ from: 'login@example.org', to, subject: 'Reset your password', text: 'Reset it here.' });
      return relay;
    } catch {
      continue;
    }
  }
  return null;
}

// Loops that never send, and a function that only builds a message.
export function buildMessage(to: string) {
  return { to, subject: 'Hello', text: 'Hello' };
}

export async function markSeen(ids: string[]) {
  for (const id of ids) {
    await db.messages.update(id, { seen: true });
  }
}
