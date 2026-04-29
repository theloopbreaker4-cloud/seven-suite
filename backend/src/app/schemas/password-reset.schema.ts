/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: password-reset.schema.ts
 * Description: Password reset token schema - MongoDB-persisted tokens with TTL index for auto-expiry
 * Created: 2026-04-24
 */

import { Schema, Document, model } from 'mongoose';

export interface PasswordResetToken extends Document {
  email:     string;
  tokenHash: string;
  expiresAt: Date;
  used:      boolean;
  createdAt: Date;
}

export const PasswordResetTokenSchema = new Schema<PasswordResetToken>(
  {
    email:     { type: String, required: true, lowercase: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date,   required: true, index: { expires: 0 } },
    used:      { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const PasswordResetTokenModel = model<PasswordResetToken>(
  'PasswordResetToken',
  PasswordResetTokenSchema,
);
