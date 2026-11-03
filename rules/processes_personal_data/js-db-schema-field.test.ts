// lexcode-expect: 5
import { Schema } from 'mongoose';
import { pgTable, serial, text, varchar, date } from 'drizzle-orm/pg-core';
import { DataTypes } from 'sequelize';

// Mongoose: a customer record with an email and a phone number.
export const customerSchema = new Schema({
  displayName: { type: String },
  email: { type: String, required: true, unique: true },
  phone: String,
  plan: { type: String, default: 'free' },
});

// Drizzle: the same record in Postgres.
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  fullName: text('full_name'),
  emailAddress: varchar('email_address', { length: 255 }).notNull(),
  dateOfBirth: date('date_of_birth'),
});

// Sequelize.
export function defineMember(sequelize: any) {
  return sequelize.define('Member', {
    nickname: { type: DataTypes.STRING },
    mobileNumber: { type: DataTypes.STRING },
  });
}
