// lexcode-expect: 0
import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import sharp from 'sharp';
import { db } from './db';

const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST });

// A queue worker that resizes images and sends nothing.
export const thumbs = new Worker('thumbs', async (job) => {
  await sharp(job.data.path).resize(200).toFile(job.data.out);
});

// Functions named for the reply they send to one person who just asked.
export async function sendPasswordReset(to: string, token: string) {
  await transporter.sendMail({ to, subject: 'Reset your password', text: `https://example.org/reset/${token}` });
}

export const sendVerificationEmail = async (to: string, token: string) => {
  await transporter.sendMail({ to, subject: 'Confirm your email address', text: `https://example.org/verify/${token}` });
};

export async function sendMagicLink(to: string, link: string) {
  await transporter.sendMail({ to, subject: 'Your sign-in link', text: link });
}

// A notifier-named function that only writes an in-app notification row.
export async function notifyInApp(userId: string, text: string) {
  await db.notifications.create({ userId, text });
}

export async function dailyTotals() {
  return db.orders.sum({ where: { day: new Date().toISOString().slice(0, 10) } });
}
