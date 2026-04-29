# External Services

This directory contains services that interact with external APIs, browser APIs, or third-party libraries.

## Services

### AnalyticsService
Tracks user events and analytics.

**Features:**
- Track custom events
- Track page views
- Set user properties
- Track timing/performance
- Track errors

**Usage:**
```typescript
constructor(private analytics: AnalyticsService) {}

// Track events
this.analytics.trackEvent('button_click', { button: 'login' });

// Track page views
this.analytics.trackPageView('/dashboard', 'Dashboard');

// Set user
this.analytics.setUser('user123', { name: 'John Doe' });

// Track timing
this.analytics.trackTiming('api', 'getUserProfile', 250);

// Track errors
this.analytics.trackError('Failed to load data', false);
```

**Integration:**
The service provides placeholders for integrating with:
- Google Analytics
- Mixpanel
- Segment
- Other analytics platforms

### StorageService
Type-safe wrapper for browser storage (localStorage/sessionStorage).

**Features:**
- Type-safe get/set operations
- JSON serialization/deserialization
- Error handling
- Check key existence
- Get all keys

**Usage:**
```typescript
constructor(private storage: StorageService) {}

// Set item
this.storage.setItem('user', { id: 1, name: 'John' });

// Get item (type-safe)
const user = this.storage.getItem<User>('user');

// Remove item
this.storage.removeItem('user');

// Check if exists
if (this.storage.hasItem('token')) {
  // ...
}

// Clear all
this.storage.clear();

// Get all keys
const keys = this.storage.getAllKeys();
```

**SessionStorageService:**
Same API as StorageService but uses sessionStorage (data persists only for current session).

```typescript
constructor(private sessionStorage: SessionStorageService) {}

this.sessionStorage.setItem('temp-data', value);
```

### NotificationService
Manages toast notifications and alerts.

**Features:**
- Success, error, warning, info notifications
- Auto-dismiss with configurable duration
- Observable stream of notifications
- Manual dismiss
- Clear all notifications

**Types:**
```typescript
type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
  dismissible?: boolean;
}
```

**Usage:**
```typescript
constructor(private notification: NotificationService) {}

// Show notifications
this.notification.success('Login successful!');
this.notification.error('Failed to save data');
this.notification.warning('Session will expire soon');
this.notification.info('New updates available');

// Custom notification
this.notification.show('success', 'Custom message', 'Title', 3000, true);

// Subscribe to notifications
this.notification.notifications$.subscribe(notification => {
  // Display notification in UI
});

// Get all active notifications
const notifications = this.notification.getAll();

// Dismiss specific notification
this.notification.dismiss('notification-id');

// Clear all
this.notification.clearAll();
```

## When to Add Services Here

Add services to this directory when:
- Interacting with external APIs (e.g., payment gateways, maps)
- Wrapping browser APIs (e.g., geolocation, notifications)
- Integrating third-party libraries
- Creating facades for complex external systems

## Best Practices

1. **Separation of Concerns**: Keep business logic in domain services
2. **Error Handling**: Always handle errors from external APIs
3. **Typing**: Use TypeScript interfaces for all data
4. **Documentation**: Document all public methods with examples
5. **Testing**: Mock external dependencies in tests
6. **Configuration**: Use environment variables for API keys/URLs

## Example: Adding a Payment Service

```typescript
// payment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private http: HttpClient) {}

  createPaymentIntent(amount: number): Observable<PaymentIntent> {
    return this.http.post<PaymentIntent>('/api/payment/intent', { amount });
  }

  confirmPayment(paymentId: string): Observable<PaymentResult> {
    return this.http.post<PaymentResult>(`/api/payment/${paymentId}/confirm`, {});
  }
}
```

## Integration Examples

### Analytics Integration

```typescript
// In app.component.ts or router events
this.router.events.pipe(
  filter(event => event instanceof NavigationEnd)
).subscribe((event: NavigationEnd) => {
  this.analytics.trackPageView(event.url);
});
```

### Storage Integration

```typescript
// In auth.service.ts
login(credentials: Credentials): Observable<LoginResponse> {
  return this.http.post<LoginResponse>('/auth/login', credentials).pipe(
    tap(response => {
      this.storage.setItem('access_token', response.token);
      this.storage.setItem('user', response.user);
    })
  );
}
```

### Notification Integration

```typescript
// In error.interceptor.ts
catchError((error: HttpErrorResponse) => {
  this.notification.error(error.message);
  return throwError(() => error);
})
```

## Directory Structure

```
services/
├── external/                    # External service integrations
│   ├── analytics.service.ts
│   ├── storage.service.ts
│   ├── notification.service.ts
│   ├── index.ts
│   └── README.md
├── auth.service.ts             # Domain services (not external)
└── ...
```
