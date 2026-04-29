/**
 * API Configuration
 *
 * Centralized API endpoints and configuration
 * Used across all services for consistent API communication
 */

import { environment } from '../../environments/environment';

/**
 * API Base URLs
 */
export const API_CONFIG = {
  baseUrl: environment.apiUrl,
  apiBaseUrl: environment.apiBaseUrl,
  apiVersion: environment.apiVersion || 'v1',
  wsUrl: environment.wsUrl,
  timeout: 30000, // 30 seconds
} as const;

/**
 * API Endpoints
 *
 * Usage:
 * this.http.get(`${API_ENDPOINTS.auth.login}`)
 */
export const API_ENDPOINTS = {
  auth: {
    login: `${API_CONFIG.baseUrl}/auth/login`,
    register: `${API_CONFIG.baseUrl}/auth/register`,
    logout: `${API_CONFIG.baseUrl}/auth/logout`,
    refresh: `${API_CONFIG.baseUrl}/auth/refresh`,
    forgotPassword: `${API_CONFIG.baseUrl}/auth/forgot-password`,
    resetPassword: `${API_CONFIG.baseUrl}/auth/reset-password`,
    verifyEmail: `${API_CONFIG.baseUrl}/auth/verify-email`,
  },

  users: {
    base: `${API_CONFIG.baseUrl}/users`,
    profile: `${API_CONFIG.baseUrl}/users/profile`,
    byId: (id: string) => `${API_CONFIG.baseUrl}/users/${id}`,
    avatar: (id: string) => `${API_CONFIG.baseUrl}/users/${id}/avatar`,
  },

  // CMS admin endpoints (PHP backend)
  cms: {
    pages: `${API_CONFIG.baseUrl}/pages`,
    posts: `${API_CONFIG.baseUrl}/posts`,
    users: `${API_CONFIG.baseUrl}/users`,
  },
} as const;

/**
 * HTTP Headers
 */
export const HTTP_HEADERS = {
  contentType: {
    json: 'application/json',
    formData: 'multipart/form-data',
    urlEncoded: 'application/x-www-form-urlencoded',
  },
  accept: 'application/json',
} as const;

/**
 * Storage Keys
 * Keys used for localStorage/sessionStorage
 */
export const STORAGE_KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  user: 'current_user',
  rememberMe: 'remember_me',
  theme: 'app_theme',
  language: 'app_language',
} as const;
