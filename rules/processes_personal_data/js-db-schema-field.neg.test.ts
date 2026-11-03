// lexcode-expect: 0
import { Schema } from 'mongoose';
import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { faker } from '@faker-js/faker';

// A name or display name alone is not a strong token.
export const profileSchema = new Schema({
  name: { type: String },
  displayName: { type: String },
  bio: String,
  website: String,
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  archived: boolean('archived').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// The app's own support address as a constant, never stored per person.
export const SUPPORT_EMAIL = 'help@example.org';
export const mailConfig = { from: SUPPORT_EMAIL, replyTo: 'no-reply@example.org' };

// A test factory builds fake rows; it declares no column.
export function buildUser(overrides = {}) {
  return {
    email: faker.internet.email(),
    phone: faker.phone.number(),
    ...overrides,
  };
}

// A validator with no storage behind it.
export function looksLikeEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

// Dates that are not birth dates.
export const releases = pgTable('releases', {
  id: serial('id').primaryKey(),
  releasedAt: timestamp('released_at'),
});

// A plain object literal that is not passed to a schema function.
export const sample = { email: 'demo@example.org', phone: '555-0100' };
