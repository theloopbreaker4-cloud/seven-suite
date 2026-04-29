/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: auth.contracts.ts
 * Description: Authentication contracts (DTOs) for API communication
 * Created: 2025-10-26
 */

/**
 * Login request contract
 * @remarks Data required to authenticate a user
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Login response contract
 * @remarks Response from login endpoint with token and user data
 */
export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  requires2FA?: boolean;
}

/**
 * Register request contract
 * @remarks Data required to create a new user account
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Register response contract
 * @remarks Response from registration endpoint
 */
export interface RegisterResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Forgot password request contract
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Reset password request contract
 */
export interface ResetPasswordRequest {
  token: string;
  password: string;
}

/**
 * Verify email request contract
 */
export interface VerifyEmailRequest {
  token: string;
}
