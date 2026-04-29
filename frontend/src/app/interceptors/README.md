# 🔌 HTTP Interceptors

HTTP Interceptors - это мощный механизм Angular для перехвата и модификации HTTP запросов и ответов.

## 📋 Список Interceptors

### 1. `auth.interceptor.ts` - Авторизация

**Назначение**: Автоматически добавляет JWT токен к каждому HTTP запросу.

**Функции**:
- Получает токен из `AuthService`
- Добавляет заголовок `Authorization: Bearer <token>` ко всем запросам
- Пропускает auth endpoints (login, register)

**Использование**:
```typescript
// Автоматически добавляет токен ко всем запросам
this.http.get('/api/users')
// → Headers: { Authorization: 'Bearer eyJhbGc...' }
```

### 2. `error.interceptor.ts` - Обработка ошибок

**Назначение**: Централизованная обработка HTTP ошибок.

**Функции**:
- Перехватывает все HTTP ошибки
- Обрабатывает специфичные коды ошибок (401, 403, 404, 500, etc.)
- Автоматически разлогинивает при 401 (Unauthorized)
- Редиректит на страницу логина при истечении сессии
- Форматирует сообщения об ошибках

**Обрабатываемые коды**:
- `401 Unauthorized` → Logout и редирект на `/signin`
- `403 Forbidden` → Сообщение о недостатке прав
- `404 Not Found` → Ресурс не найден
- `500 Internal Server Error` → Ошибка сервера
- `503 Service Unavailable` → Сервис недоступен

**Использование**:
```typescript
this.http.get('/api/protected').subscribe({
  error: (error) => {
    console.log(error.message); // Formatted error message
    console.log(error.status);  // HTTP status code
  }
});
```

### 3. `logging.interceptor.ts` - Логирование

**Назначение**: Логирование HTTP запросов и ответов в консоль (только в dev режиме).

**Функции**:
- Логирует все HTTP запросы (method, URL, headers, body)
- Логирует ответы (status, body)
- Измеряет время выполнения запроса
- Отключается в production режиме

**Пример вывода в консоль**:
```
🌐 HTTP GET /api/users
📤 Request Headers: { Authorization: 'Bearer...' }
📥 Response Status: 200
📦 Response Body: [{ id: 1, name: 'John' }]
⏱️ Request succeeded in 245ms
```

### 4. `cache.interceptor.ts` - Кэширование

**Назначение**: Кэширование GET запросов для уменьшения нагрузки на сервер.

**Функции**:
- Кэширует только GET запросы
- Время жизни кэша: 5 минут (настраивается)
- Пропускает определенные endpoints (auth, user profile)
- Методы для очистки кэша

**API**:
```typescript
constructor(private cacheInterceptor: CacheInterceptor) {}

// Очистить весь кэш
this.cacheInterceptor.clearCache();

// Очистить кэш для конкретного URL
this.cacheInterceptor.clearCacheForUrl('/api/users');
```

### 5. `loading.interceptor.ts` - Индикатор загрузки

**Назначение**: Управление глобальным состоянием загрузки.

**Функции**:
- Автоматически показывает loading indicator при HTTP запросах
- Скрывает loading indicator после завершения запроса
- Подсчитывает количество активных запросов
- Интегрируется с `LoadingService`

**Использование**:
```typescript
// В компоненте
constructor(private loadingService: LoadingService) {}

ngOnInit() {
  // Проверить, есть ли активные запросы
  const isLoading = this.loadingService.isLoading;
}
```

**В шаблоне**:
```html
<app-loading *ngIf="loadingService.isLoading"></app-loading>
```

## 🔧 Регистрация Interceptors

Добавьте interceptors в `app.module.ts` в порядке выполнения:

```typescript
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  AuthInterceptor,
  ErrorInterceptor,
  LoggingInterceptor,
  CacheInterceptor,
  LoadingInterceptor
} from './interceptors';

@NgModule({
  providers: [
    // Порядок важен! Interceptors выполняются в порядке регистрации
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,  // 1. Показать loading
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,     // 2. Добавить токен
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CacheInterceptor,    // 3. Проверить кэш
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoggingInterceptor,  // 4. Залогировать запрос
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,    // 5. Обработать ошибки
      multi: true
    }
  ]
})
export class AppModule { }
```

## 📊 Порядок выполнения

```
Request Flow:
1. LoadingInterceptor → startLoading()
2. AuthInterceptor → add Bearer token
3. CacheInterceptor → check cache
4. LoggingInterceptor → log request
5. → HTTP Request to Server
6. LoggingInterceptor → log response
7. ErrorInterceptor → handle errors (if any)
8. LoadingInterceptor → stopLoading()
```

## ✅ Best Practices

### 1. Правильный порядок interceptors

Порядок регистрации важен! Interceptors выполняются по принципу "матрешки":
- **Request**: сверху вниз (Loading → Auth → Cache → Logging → Error)
- **Response**: снизу вверх (Error → Logging → Cache → Auth → Loading)

### 2. Условная обработка

Пропускайте определенные запросы, если нужно:

```typescript
intercept(request: HttpRequest<any>, next: HttpHandler) {
  // Пропустить для определенных URL
  if (request.url.includes('/public')) {
    return next.handle(request);
  }
  // Обработка...
}
```

### 3. Клонирование запросов

HTTP запросы иммутабельны, используйте `clone()`:

```typescript
const modifiedRequest = request.clone({
  setHeaders: { 'X-Custom-Header': 'value' }
});
```

### 4. Обработка ошибок

Всегда возвращайте observable из `catchError`:

```typescript
return next.handle(request).pipe(
  catchError((error: HttpErrorResponse) => {
    // Обработка ошибки
    return throwError(() => error);
  })
);
```

### 5. Очистка ресурсов

Используйте `finalize()` для гарантированной очистки:

```typescript
return next.handle(request).pipe(
  finalize(() => {
    // Этот код выполнится всегда (success или error)
    this.cleanup();
  })
);
```

## 🎯 Расширение функциональности

### Добавление нового interceptor

1. Создайте файл: `my-feature.interceptor.ts`
2. Реализуйте интерфейс `HttpInterceptor`
3. Зарегистрируйте в `app.module.ts`
4. Экспортируйте в `index.ts`

**Пример**:
```typescript
@Injectable()
export class MyFeatureInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ваша логика
    return next.handle(req);
  }
}
```

### Interceptor с настройками

Создайте injection token для конфигурации:

```typescript
export const RETRY_CONFIG = new InjectionToken<RetryConfig>('retry.config');

@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  constructor(@Inject(RETRY_CONFIG) private config: RetryConfig) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      retry(this.config.maxRetries)
    );
  }
}
```

## 🔗 Связь с другими компонентами

### Services
```typescript
// AuthService предоставляет токен для AuthInterceptor
// LoadingService получает состояние от LoadingInterceptor
```

### Guards
```typescript
// ErrorInterceptor работает вместе с AuthGuard
// При 401 → logout → guard блокирует доступ
```

### Components
```typescript
// Компоненты получают обработанные ошибки
// Компоненты используют LoadingService для UI
```

## 📝 Примеры использования

### Пример 1: Защищенный запрос с автоматической авторизацией

```typescript
// Компонент
this.http.get('/api/users').subscribe({
  next: (users) => console.log(users),
  error: (error) => console.error(error.message)
});

// Автоматически:
// 1. LoadingInterceptor показывает loading
// 2. AuthInterceptor добавляет токен
// 3. CacheInterceptor проверяет кэш
// 4. LoggingInterceptor логирует запрос
// 5. ErrorInterceptor обрабатывает ошибки
// 6. LoadingInterceptor скрывает loading
```

### Пример 2: Ручная очистка кэша

```typescript
@Component({...})
export class UserListComponent {
  constructor(
    private http: HttpClient,
    private cacheInterceptor: CacheInterceptor
  ) {}

  refreshUsers() {
    // Очистить кэш перед загрузкой
    this.cacheInterceptor.clearCacheForUrl('/api/users');
    this.http.get('/api/users').subscribe(users => {
      // Новые данные
    });
  }
}
```

### Пример 3: Кастомный loading indicator

```typescript
@Component({
  template: `
    <div *ngIf="loadingService.isLoading" class="spinner">
      Loading...
    </div>
  `
})
export class AppComponent {
  constructor(public loadingService: LoadingService) {}
}
```

---

*Interceptors - это мощный инструмент для централизованной обработки HTTP трафика в Angular приложении.*
