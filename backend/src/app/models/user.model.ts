/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: user.model.ts
 * Description: User data model - defines user document structure
 * Created: 2025-10-26
 */

import { Document } from 'mongoose';
import { IUser } from '../interfaces/user.interface';

/**
 * User - user document model extending Mongoose Document
 * @remarks Implements IUser interface with full user profile fields
 */
export class User extends Document implements IUser {
  // Profile
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  password?: string;
  avatar?: string;
  mobile?: string;
  country?: string;

  // Access control
  role?: 'user' | 'admin';
  isActive?: boolean;

  // OAuth
  provider?: 'local' | 'google' | 'github' | 'discord';
  providerId?: string;

  // 2FA
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;

  // Timestamps
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
