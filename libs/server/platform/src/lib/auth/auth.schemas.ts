/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { z } from 'zod';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address'))
  .pipe(z.string().max(254));
const password = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(200, 'Use at most 200 characters');

export const signupSchema = z.object({
  email,
  password,
  name: z.string().trim().min(1, 'Required').max(100),
  organizationName: z.string().trim().min(1, 'Required').max(120),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email,
  // No length rules on login: never tell an attacker which passwords could be valid.
  password: z.string().min(1, 'Required').max(200),
  organization: z.string().trim().max(64).optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;
