// lexcode-expect: 5
import cron from 'node-cron';
import { CronJob } from 'cron';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import sgMail from '@sendgrid/mail';
import { db } from './db';

const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST });
const sms = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

// Every Monday at 9am, mail the weekly summary to whoever is subscribed.
cron.schedule('0 9 * * 1', async () => {
  const subs = await db.subscribers.findMany();
  await transporter.sendMail({ from: 'weekly@example.org', to: subs.map((s) => s.email), subject: 'Your week' });
});

// Nightly reminder texts for tomorrow's appointments.
new CronJob('0 18 * * *', async () => {
  const due = await db.appointments.dueTomorrow();
  await sms.messages.create({ to: due[0].phone, from: process.env.TWILIO_FROM, body: 'Reminder: your appointment is tomorrow.' });
});

// A polling timer that mails an alert when a threshold is crossed.
setInterval(async () => {
  const over = await db.metrics.overThreshold();
  if (over) {
    await sgMail.send({ to: 'ops-list@example.org', from: 'alerts@example.org', subject: 'Threshold crossed', text: 'Look at the dashboard.' });
  }
}, 60_000);

// Cloudflare Workers cron trigger.
export default {
  async scheduled(event: unknown, env: { RESEND_KEY: string }, ctx: unknown) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_KEY}` },
      body: JSON.stringify({ from: 'digest@example.org', to: ['list@example.org'], subject: 'Daily digest' }),
    });
  },
};

export function nightlyStatusMail(rows: string[]) {
  cron.schedule('0 2 * * *', () => {
    sendEmail('team@example.org', rows.join('\n'));
  });
}

function sendEmail(to: string, body: string) {
  return transporter.sendMail({ to, subject: 'Status', text: body });
}
