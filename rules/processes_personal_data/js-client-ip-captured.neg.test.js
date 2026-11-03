// lexcode-expect: 0
import express from 'express';
import rateLimit from 'express-rate-limit';
import logger from './logger.js';

const app = express();

// An address used only as an in-memory rate-limit key is not written anywhere.
app.use(rateLimit({ windowMs: 60_000, limit: 100, keyGenerator: (req) => req.ip }));

// Logging that carries no address.
app.use((req, res, next) => {
  logger.info({ method: req.method, path: req.path }, 'request');
  next();
});

// The server's own bind address.
const config = { ip: '0.0.0.0', port: 3000 };
app.listen(config.port, config.ip, () => {
  console.log('listening on', config.ip, config.port);
});

// An allow-list check compares and discards the address.
const allowed = new Set(['10.0.0.5']);
app.use('/admin', (req, res, next) => {
  if (!allowed.has(req.ip)) return res.sendStatus(403);
  return next();
});

// Forwarded protocol and host are not the person's address.
app.get('/where', (req, res) => {
  const proto = req.headers['x-forwarded-proto'];
  console.log('served over', proto);
  res.end();
});

// A literal address used in a test of the logger itself.
logger.info({ ip: '127.0.0.1' }, 'startup check');
