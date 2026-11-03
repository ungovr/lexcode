// lexcode-expect: 0
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST });

export async function sendDigest(to: string) {
  await transporter.sendMail({
    from: 'news@example.org',
    to,
    subject: 'Public records law: this week in review',
    text: 'The week in transparency news, from our editors.',
  });
}

export async function sendContactReceipt(to: string) {
  await transporter.sendMail({ from: 'hello@example.org', to, subject: 'We got your message', text: 'Thanks.' });
}

export const HELP_TEXT = 'Under the Freedom of Information Act, you may ask an agency for its records.';
