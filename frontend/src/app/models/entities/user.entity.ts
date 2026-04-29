/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: user.entity.ts
 * Description: User entity - represents user data from the backend
 * Created: 2025-10-26
 */

/**
 * User entity interface
 * @remarks Represents a user object as returned from the API
 */
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
