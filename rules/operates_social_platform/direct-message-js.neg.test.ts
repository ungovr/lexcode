// lexcode-expect: 0
import nodemailer from 'nodemailer';
import { prisma } from './db';

const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST });

export async function sendReceipt(orderId: string, to: string) {
  await transporter.sendMail({ from: 'orders@example.org', to, subject: `Receipt ${orderId}` });
  await prisma.auditLog.create({ data: { actorId: 'system', targetId: orderId, action: 'receipt-sent' } });
}

io.on('connection', (socket) => {
  socket.on('message', (text: string) => io.to('lobby').emit('message', text));
});
