// lexcode-expect: 0
import { z } from 'zod';

// Environment validation: the app's own support address, not a person's.
export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  SUPPORT_EMAIL: z.string().email(),
  PORT: z.coerce.number().default(3000),
});

// A bare validator with no form or storage around it.
export function isEmail(value: string): boolean {
  return z.string().email().safeParse(value).success;
}

// Name and message fields only: no strong token.
export const feedbackSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().optional(),
  message: z.string().min(10),
});

// A schema that names an email key but validates it as plain text, with no email rule.
export const aliasSchema = z.object({
  email: z.string().min(3),
});

// A different object-like helper with an email property.
export const mailer = { email: z.string().email() };
