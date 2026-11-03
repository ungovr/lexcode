// lexcode-expect: 0
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// "Credentials" here means a username and password, not a verifiable credential.
export async function verifyCredential(email, password, db) {
  const user = await db.users.findByEmail(email);
  if (!user) return false;
  return bcrypt.compare(password, user.passwordHash);
}

export async function verifyPresentation(req) {
  return req.session && req.session.userId !== undefined;
}

const loginSchema = z.object({ email: z.string(), password: z.string() });

export async function login(req, db) {
  const body = loginSchema.parse(req.body);
  const ok = await verifyCredential(body.email, body.password, db);
  return ok ? { status: 200 } : { status: 401 };
}

// A method with the same name on the app's own client.
export const api = {
  verifyCredential: (token) => fetch('/api/session', { headers: { authorization: token } }),
};
export const check = api.verifyCredential('abc');
