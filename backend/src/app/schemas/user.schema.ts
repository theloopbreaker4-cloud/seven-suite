/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: user.schema.ts
 * Description: User Mongoose schema - defines database structure and validation
 * Created: 2025-10-26
 */

import { Schema, model } from 'mongoose';
import { User } from '../models/user.model';

/**
 * UserSchema - Mongoose schema for User collection
 * @remarks Defines required fields and constraints (email is unique)
 */
export const UserSchema = new Schema<User>(
  {
    // Profile
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    userName: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: false },
    avatar: { type: String, required: false },
    mobile: { type: String, required: false, trim: true },
    country: { type: String, required: false, trim: true },

    // Access control
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },

    // OAuth
    provider: { type: String, enum: ['local', 'google', 'github', 'discord'], default: 'local' },
    providerId: { type: String, required: false },

    // 2FA
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, required: false },

    // Activity
    lastLoginAt: { type: Date, required: false },
  },
  {
    timestamps: true,
  },
);

/**
 * UserModel - Mongoose model for User documents
 */
export const UserModel = model<User>('User', UserSchema);


