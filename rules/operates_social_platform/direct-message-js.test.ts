// lexcode-expect: 2
import { Server } from 'socket.io';
import { prisma } from './db';

const io = new Server(3001);

io.on('connection', (socket) => {
  socket.on('private_message', async (payload: { to: string; body: string }) => {
    const message = await prisma.message.create({
      data: { senderId: socket.data.userId, recipientId: payload.to, body: payload.body },
    });
    io.to(`user:${payload.to}`).emit('private_message', message);
  });
});
