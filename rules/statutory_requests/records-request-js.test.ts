// lexcode-expect: 2
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST });

export async function fileRequest(agencyEmail: string, topic: string) {
  await transporter.sendMail({
    from: 'requests@example.org',
    to: agencyEmail,
    subject: `Freedom of Information request: ${topic}`,
    text: requestLetter(topic),
  });
}

function requestLetter(topic: string): string {
  return `Dear Information Officer,

Under the Freedom of Information Act 2000, I am writing to request the following
information about ${topic}: the total spent in the last financial year, and the
contracts that account for it.`;
}
