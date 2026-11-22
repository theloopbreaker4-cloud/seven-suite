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

export const tokenSchema = z.object({ token: z.string().min(16).max(200) });
export type TokenInput = z.infer<typeof tokenSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(16).max(200),
  password,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const switchOrganizationSchema = z.object({
  organization: z.string().trim().min(1).max(64),
});
export type SwitchOrganizationInput = z.infer<typeof switchOrganizationSchema>;

export const inviteSchema = z.object({
  email,
  role: z.string().trim().min(1).max(40),
});
export type InviteInput = z.infer<typeof inviteSchema>;

export const acceptInvitationSchema = z.object({
  token: z.string().min(16).max(200),
  name: z.string().trim().min(1).max(100).optional(),
  password: z.string().max(200).optional(),
});
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

/** A 6-digit authenticator code or a recovery code (xxxx-xxxx-xxxx). */
const secondFactor = z.string().trim().min(6, 'Required').max(32);

export const mfaLoginSchema = z.object({
  mfaToken: z.string().min(20).max(2000),
  code: secondFactor,
});
export type MfaLoginInput = z.infer<typeof mfaLoginSchema>;

export const twoFactorCodeSchema = z.object({ code: secondFactor });
export type TwoFactorCodeInput = z.infer<typeof twoFactorCodeSchema>;

export const twoFactorDisableSchema = z.object({
  password: z.string().min(1, 'Required').max(200),
  code: secondFactor,
});
export type TwoFactorDisableInput = z.infer<typeof twoFactorDisableSchema>;
