/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: user.interface.ts
 * Description: User interface - defines user entity structure
 * Created: 2025-10-26
 */

/**
 * IUser - interface defining user properties
 * @remarks Complete user structure with authentication and profile fields
 */
export interface IUser {
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
