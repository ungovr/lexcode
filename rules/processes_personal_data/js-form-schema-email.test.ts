// lexcode-expect: 3
import { z } from 'zod';
import * as yup from 'yup';
import Joi from 'joi';

// A contact form: the person types an email address and a message that the server keeps.
export const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().trim().email('Enter a valid email address'),
  message: z.string().min(10).max(2000),
});

// A newsletter sign-up validated with yup.
export const subscribeSchema = yup.object({
  email: yup.string().email().required(),
  topics: yup.array(yup.string()).default([]),
});

// Request validation in an API route with Joi.
export const inviteSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('member', 'admin'),
});

export type ContactInput = z.infer<typeof contactSchema>;
