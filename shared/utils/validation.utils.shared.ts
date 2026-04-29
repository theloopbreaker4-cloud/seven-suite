/**
 * ⚠️ SHARED FILE - DO NOT MODIFY IN BACKEND OR FRONTEND
 *
 * Project: Seven
 * Source: shared/utils/validation.utils.shared.ts
 * Used by: Backend (validators), Frontend (form validators)
 *
 * Edit only in shared directory!
 * Changes here will affect both backend and frontend applications.
 *
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * Created: 2025-10-26
 */

/**
 * Email validation regex
 * Validates standard email format
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Strong password regex
 * Requires: 1 uppercase, 1 lowercase, 1 digit, 1 special char, min 8 chars
 */
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Phone number regex (international format)
 * Example: +1234567890, +12-345-6789, +1 (234) 567-8900
 */
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

/**
 * Username regex
 * Allows: letters, numbers, underscores, hyphens (3-30 chars)
 */
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

/**
 * Validates email address format
 * @param email - Email address to validate
 * @returns true if email is valid
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validates password strength
 * Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
 * @param password - Password to validate
 * @returns true if password meets requirements
 */
export function isStrongPassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }
  return STRONG_PASSWORD_REGEX.test(password);
}

/**
 * Validates phone number format (international)
 * @param phone - Phone number to validate
 * @returns true if phone is valid
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  return PHONE_REGEX.test(phone.trim());
}

/**
 * Validates username format
 * @param username - Username to validate
 * @returns true if username is valid
 */
export function isValidUsername(username: string): boolean {
  if (!username || typeof username !== 'string') {
    return false;
  }
  return USERNAME_REGEX.test(username.trim());
}

/**
 * Validates user age
 * @param age - Age to validate
 * @returns true if age is between 18 and 120
 */
export function isValidAge(age: number): boolean {
  return typeof age === 'number' && age >= 18 && age <= 120;
}

/**
 * Validates string length
 * @param value - String to validate
 * @param min - Minimum length
 * @param max - Maximum length
 * @returns true if length is within range
 */
export function isValidLength(value: string, min: number, max: number): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  const length = value.trim().length;
  return length >= min && length <= max;
}

/**
 * Validates URL format
 * @param url - URL to validate
 * @returns true if URL is valid
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes string by removing special characters
 * @param value - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }
  return value.trim().replace(/[<>'"]/g, '');
}

/**
 * Checks if string is empty or whitespace only
 * @param value - String to check
 * @returns true if string is empty or whitespace
 */
export function isEmpty(value: string): boolean {
  return !value || value.trim().length === 0;
}
