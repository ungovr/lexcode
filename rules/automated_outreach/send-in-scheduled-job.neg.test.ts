// lexcode-expect: 0
import cron from 'node-cron';
import express from 'express';
import nodemailer from 'nodemailer';
import { db } from './db';

const app = express();
const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST });

// Scheduled jobs that send nothing to anyone.
cron.schedule('0 3 * * *', async () => {
  await db.sessions.deleteExpired();
});

setInterval(async () => {
  const res = await fetch('http://localhost:3000/health');
  if (!res.ok) console.error('health check failed');
}, 30_000);

// Mail sent from a request handler, in reply to what the person just did.
app.post('/contact', async (req, res) => {
  await db.contactRequests.create(req.body);
  await transporter.sendMail({ to: req.body.email, subject: 'We got your message', text: 'Thanks for writing.' });
  res.sendStatus(204);
});

app.post('/forgot-password', async (req, res) => {
  const token = await db.resetTokens.mint(req.body.email);
  await transporter.sendMail({ to: req.body.email, subject: 'Password reset', text: `https://example.org/reset/${token}` });
  res.sendStatus(204);
});

// An object with a scheduled method that is not a cron trigger handler.
export const planner = {
  scheduled(a: number, b: number, c: number) {
    return a + b + c;
  },
};
