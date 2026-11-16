// lexcode-expect: 0
// Password hashing with a bundled library is not shipping encryption: bcryptjs and argon2.
import bcrypt from 'bcryptjs';
import argon2 from 'argon2';

export async function register(email, password) {
  const hash = await bcrypt.hash(password, 12);
  return { email, hash };
}

export function legacyHash(password) {
  return bcrypt.hashSync(password, 10);
}

export async function strongHash(password) {
  return argon2.hash(password);
}
