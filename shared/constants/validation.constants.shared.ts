/**
 * ⚠️ SHARED FILE - DO NOT MODIFY IN BACKEND OR FRONTEND
 *
 * Project: Seven
 * Source: shared/constants/validation.constants.shared.ts
 * Used by: Backend (validators), Frontend (form validators)
 *
 * Edit only in shared directory!
 * Changes here will affect both backend and frontend applications.
 *
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * Created: 2025-10-26
 */

// ==================== Password ====================

/** Minimum password length */
export const PASSWORD_MIN_LENGTH = 8;

/** Maximum password length */
export const PASSWORD_MAX_LENGTH = 128;

// ==================== Username ====================

/** Minimum username length */
export const USERNAME_MIN_LENGTH = 3;

/** Maximum username length */
export const USERNAME_MAX_LENGTH = 30;

// ==================== Email ====================

/** Maximum email length */
export const EMAIL_MAX_LENGTH = 255;

// ==================== Name ====================

/** Minimum first/last name length */
export const NAME_MIN_LENGTH = 2;

/** Maximum first/last name length */
export const NAME_MAX_LENGTH = 50;

// ==================== Age ====================

/** Minimum user age */
export const MIN_AGE = 18;

/** Maximum user age */
export const MAX_AGE = 120;

// ==================== File Upload ====================

/** Maximum file size in bytes (5 MB) */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Maximum image file size in bytes (2 MB) */
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

/** Allowed image MIME types */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

/** Allowed document MIME types */
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

// ==================== Pagination ====================

/** Default page size for pagination */
export const DEFAULT_PAGE_SIZE = 10;

/** Maximum page size for pagination */
export const MAX_PAGE_SIZE = 100;

/** Minimum page size for pagination */
export const MIN_PAGE_SIZE = 1;

// ==================== Rate Limiting ====================

/** Maximum login attempts before lockout */
export const MAX_LOGIN_ATTEMPTS = 5;

/** Lockout duration in minutes */
export const LOCKOUT_DURATION_MINUTES = 15;

/** Maximum API requests per minute */
export const MAX_REQUESTS_PER_MINUTE = 60;

// ==================== Regex Patterns ====================

/** Email validation regex */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Phone number regex (international format) */
export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

/** Username regex (letters, numbers, underscore, hyphen) */
export const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

/** Strong password regex (min 8 chars, 1 upper, 1 lower, 1 digit, 1 special) */
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/** URL regex */
export const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

// ==================== Error Messages ====================

/** Validation error messages */
export const VALIDATION_MESSAGES = {
  EMAIL_INVALID: 'Invalid email address',
  EMAIL_REQUIRED: 'Email is required',
  PASSWORD_WEAK: 'Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 digit, and 1 special character',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_TOO_SHORT: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
  PASSWORD_TOO_LONG: `Password must not exceed ${PASSWORD_MAX_LENGTH} characters`,
  USERNAME_INVALID: 'Username can only contain letters, numbers, underscores, and hyphens',
  USERNAME_TOO_SHORT: `Username must be at least ${USERNAME_MIN_LENGTH} characters`,
  USERNAME_TOO_LONG: `Username must not exceed ${USERNAME_MAX_LENGTH} characters`,
  NAME_TOO_SHORT: `Name must be at least ${NAME_MIN_LENGTH} characters`,
  NAME_TOO_LONG: `Name must not exceed ${NAME_MAX_LENGTH} characters`,
  AGE_TOO_YOUNG: `You must be at least ${MIN_AGE} years old`,
  AGE_INVALID: `Age must be between ${MIN_AGE} and ${MAX_AGE}`,
  FILE_TOO_LARGE: `File size must not exceed ${MAX_FILE_SIZE / 1024 / 1024}MB`,
  FILE_TYPE_INVALID: 'File type is not allowed'
} as const;
