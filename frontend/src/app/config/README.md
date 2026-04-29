# Configuration Files

This directory contains all application configuration files.

## Files

### api.config.ts
Centralized API configuration including:
- Base URL and API version
- All API endpoints
- HTTP headers
- Storage keys for localStorage/sessionStorage

**Usage:**
```typescript
import { API_ENDPOINTS, STORAGE_KEYS } from '@app/config';

// Use API endpoints
this.http.get(API_ENDPOINTS.users.profile);
this.http.get(API_ENDPOINTS.users.byId('123'));

// Use storage keys
localStorage.setItem(STORAGE_KEYS.accessToken, token);
```

### app.config.ts
Global application settings including:
- App metadata (name, version)
- Pagination settings
- Date/time formats
- File upload limits
- UI configuration (theme, language)
- Cache settings
- Validation rules
- Notification settings

**Usage:**
```typescript
import { APP_CONFIG, PAGINATION_CONFIG, FILE_UPLOAD_CONFIG } from '@app/config';

// Use app config
console.log(APP_CONFIG.name); // "Seven"

// Use pagination config
this.pageSize = PAGINATION_CONFIG.defaultPageSize; // 10

// Validate file size
if (file.size > FILE_UPLOAD_CONFIG.maxFileSize) {
  // Error: file too large
}
```

## Best Practices

1. **Centralize Configuration**: Keep all configuration in this directory
2. **Type Safety**: Use TypeScript types and `as const` for immutability
3. **Environment Variables**: Use `environment.ts` for environment-specific values
4. **No Secrets**: Never commit sensitive data (API keys, passwords)
5. **Documentation**: Document each configuration property

## Adding New Configuration

1. Create a new file: `feature-name.config.ts`
2. Export constants with descriptive names
3. Add to `index.ts` barrel file
4. Document usage in this README

Example:
```typescript
// payment.config.ts
export const PAYMENT_CONFIG = {
  stripePublicKey: environment.stripePublicKey,
  currency: 'USD',
  allowedMethods: ['card', 'paypal'] as const,
} as const;
```
