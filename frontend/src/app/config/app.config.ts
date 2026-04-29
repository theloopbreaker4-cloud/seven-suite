/**
 * Application Configuration
 *
 * Global app settings and constants
 */

/**
 * Application metadata
 */
export const APP_CONFIG = {
  name: 'Seven',
  version: '1.0.0',
  description: 'Angular + NestJS Application',
  author: 'Your Team',
} as const;

/**
 * Pagination settings
 */
export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 25, 50, 100],
  maxPageSize: 100,
} as const;

/**
 * Date/Time formats
 */
export const DATE_TIME_CONFIG = {
  dateFormat: 'dd/MM/yyyy',
  timeFormat: 'HH:mm:ss',
  dateTimeFormat: 'dd/MM/yyyy HH:mm',
  timezone: 'UTC',
} as const;

/**
 * File upload settings
 */
export const FILE_UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxFiles: 5,
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  defaultTheme: 'light',
  availableThemes: ['light', 'dark', 'auto'] as const,
  defaultLanguage: 'en',
  availableLanguages: ['en', 'ru', 'ka', 'uk', 'az', 'hy', 'be', 'de', 'fr'] as const,
  sidebarWidth: 250,
  mobileBreakpoint: 768,
} as const;

/**
 * Cache settings
 */
export const CACHE_CONFIG = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 100, // maximum number of cached items
  enableCache: true,
} as const;

/**
 * Validation settings
 */
export const VALIDATION_CONFIG = {
  debounceTime: 300, // ms for input debounce
  passwordMinLength: 8,
  usernameMinLength: 3,
  usernameMaxLength: 30,
} as const;

/**
 * Toast/Notification settings
 */
export const NOTIFICATION_CONFIG = {
  duration: 3000, // ms
  position: 'top-right' as const,
  maxNotifications: 5,
} as const;
