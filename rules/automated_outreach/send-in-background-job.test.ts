// lexcode-expect: 4
import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import { db } from './db';

const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST });

// A queue worker: the code does not show who enqueued the job or why.
export const mailWorker = new Worker('mail', async (job) => {
  await transporter.sendMail({ to: job.data.to, subject: job.data.subject, text: job.data.text });
});

// A function whose name says it notifies people about a change.
export async function notifyWatchers(requestId: string) {
  const watchers = await db.watchers.forRequest(requestId);
  await transporter.sendMail({ to: watchers.map((w) => w.email), subject: 'A request you follow changed' });
}

export const sendDailyDigest = async (userId: string) => {
  const user = await db.users.get(userId);
  await transporter.sendMail({ to: user.email, subject: 'Your daily digest' });
};

export async function reminderEmail(to: string) {
  await transporter.sendMail({ to, subject: 'Reminder' });
}
