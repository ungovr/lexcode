// lexcode-expect: 4
import express from 'express';
import { pool } from './db.js';
import logger from './logger.js';

const app = express();

// Writes the visitor's address into the access log.
app.use((req, res, next) => {
  logger.info({ ip: req.ip, path: req.path }, 'request');
  next();
});

// Stores the forwarded address with each signup.
app.post('/signup', async (req, res) => {
  const forwarded = req.headers['x-forwarded-for'];
  await pool.query('INSERT INTO signups (email, ip) VALUES ($1, $2)', [req.body.email, forwarded]);
  res.sendStatus(201);
});

// Next.js route handler that logs the client address.
export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  console.log('contact form from', ip);
  return Response.json({ ok: true });
}

// Records the socket address on a visit row.
app.get('/hit', async (req, res) => {
  const address = req.socket.remoteAddress;
  await prisma.visit.create({ data: { address, at: new Date() } });
  res.end();
});
