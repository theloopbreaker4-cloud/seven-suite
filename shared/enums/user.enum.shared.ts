/**
 * ⚠️ SHARED FILE - DO NOT MODIFY IN BACKEND OR FRONTEND
 *
 * Project: Seven
 * Source: shared/enums/user.enum.shared.ts
 * Used by: Backend (user.schema.ts, auth.service.ts), Frontend (user.entity.ts)
 *
 * Edit only in shared directory!
 * Changes here will affect both backend and frontend applications.
 *
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * Created: 2025-10-26
 */

/**
 * UserRole - enumeration of user access levels
 * @remarks Defines three roles: Admin (full access), User (standard access), Guest (limited access)
 */
export enum UserRole {
  /** Administrator with full system access */
  Admin = 'admin',
  /** Regular authenticated user */
  User = 'user',
  /** Guest user with limited permissions */
  Guest = 'guest',
}