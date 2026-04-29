# 📂 Angular Application Structure

Полное руководство по структуре Angular приложения проекта Seven.

## 🏗️ Общая структура

```
frontend/src/app/
├── components/         # Переиспользуемые компоненты
│   ├── loading/       # Компонент загрузки
│   ├── modal/         # Модальные окна
│   └── page-pieces/   # Части страниц (header, footer, navigation)
├── config/            # Конфигурационные файлы
├── data/              # Статические данные, константы
├── directives/        # Кастомные директивы
│   ├── emailExist/    # Проверка существования email
│   └── numbersOnly/   # Ввод только цифр
├── enums/             # Перечисления (enum)
├── guards/            # Route guards для защиты маршрутов
│   └── auth.guard.ts  # Проверка авторизации
├── interceptors/      # HTTP interceptors
├── models/            # Модели данных (entities и contracts)
│   ├── entities/      # Сущности из backend
│   ├── contracts/     # DTO для API (Request/Response)
│   └── index.ts       # Barrel file
├── modules/           # Feature modules
├── pages/             # Страницы приложения
│   ├── main-page/             # Главная страница
│   ├── signin-page/           # Страница входа
│   ├── signup-page/           # Страница регистрации
│   ├── forgot-password-page/  # Восстановление пароля
│   ├── verify-email-page/     # Подтверждение email
│   ├── dashboard-page/        # Дашборд пользователя
│   ├── profile-page/          # Профиль пользователя
│   ├── settings-page/         # Настройки
│   ├── faq-page/              # FAQ
│   ├── support-page/          # Поддержка
│   └── error404-page/         # 404 страница
├── pipes/             # Кастомные pipes
│   ├── filtering/     # Pipes для фильтрации
│   └── formatting/    # Pipes для форматирования
├── services/          # Сервисы
│   ├── auth.service.ts      # Сервис авторизации
│   └── external/            # Внешние API сервисы
├── types/             # TypeScript type definitions
└── utils/             # Утилиты и helper функции
```

## 📋 Описание папок

### `components/` - Переиспользуемые компоненты

**Назначение**: Компоненты, которые используются в разных частях приложения.

**Подпапки**:
- `loading/` - индикаторы загрузки, спиннеры
- `modal/` - модальные окна, диалоги
- `page-pieces/` - общие части страниц (header, footer, navigation)

**Правила**:
- Компонент должен быть переиспользуемым
- Компонент не должен зависеть от конкретной страницы
- Используйте `@Input()` и `@Output()` для коммуникации

**Пример**:
```typescript
@Component({
  selector: 'app-loading',
  template: '<mat-spinner></mat-spinner>'
})
export class LoadingComponent {}
```

### `pages/` - Страницы приложения

**Назначение**: Компоненты-страницы, соответствующие роутам приложения.

**Правила**:
- Одна папка = одна страница = один роут
- Название папки совпадает с названием компонента
- Страница может использовать компоненты из `components/`

**Структура страницы**:
```
signin-page/
├── signin-page.component.ts
├── signin-page.component.html
├── signin-page.component.less
└── signin-page.component.spec.ts
```

### `models/` - Модели данных

**Назначение**: Описание структуры данных приложения.

**Подразделы**:
- `entities/` - модели сущностей из backend (User, Product, Order)
- `contracts/` - DTO для API (LoginRequest, RegisterResponse)

**Подробнее**: См. [models/README.md](frontend/src/app/models/README.md)

### `services/` - Сервисы

**Назначение**: Бизнес-логика, работа с API, управление состоянием.

**Примеры**:
- `auth.service.ts` - авторизация и authentication
- `user.service.ts` - работа с пользователями
- `api.service.ts` - базовый сервис для HTTP запросов

**Best Practices**:
```typescript
@Injectable({
  providedIn: 'root'  // Singleton сервис
})
export class AuthService {
  constructor(private http: HttpClient) {}
}
```

### `guards/` - Route Guards

**Назначение**: Защита роутов от несанкционированного доступа.

**Примеры**:
- `auth.guard.ts` - проверка авторизации
- `role.guard.ts` - проверка ролей пользователя

**Пример**:
```typescript
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  canActivate(): boolean {
    return this.authService.isAuthenticated();
  }
}
```

### `directives/` - Кастомные директивы

**Назначение**: Расширение поведения HTML элементов.

**Примеры**:
- `numbersOnly` - разрешает ввод только цифр
- `emailExist` - проверяет существование email

**Пример**:
```typescript
@Directive({
  selector: '[appNumbersOnly]'
})
export class NumbersOnlyDirective {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Логика директивы
  }
}
```

### `pipes/` - Кастомные Pipes

**Назначение**: Преобразование данных в шаблонах.

**Подпапки**:
- `filtering/` - pipes для фильтрации массивов
- `formatting/` - pipes для форматирования (даты, числа, текст)

**Пример**:
```typescript
@Pipe({ name: 'capitalize' })
export class CapitalizePipe implements PipeTransform {
  transform(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
```

### `interceptors/` - HTTP Interceptors

**Назначение**: Перехват и модификация HTTP запросов/ответов.

**Примеры**:
- `auth.interceptor.ts` - добавление токена в headers
- `error.interceptor.ts` - обработка ошибок
- `logging.interceptor.ts` - логирование запросов

**Пример**:
```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = this.authService.getToken();
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next.handle(authReq);
  }
}
```

### `enums/` - Перечисления

**Назначение**: Константные значения с ограниченным набором.

**Примеры**:
```typescript
// user-role.enum.ts
export enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest'
}

// order-status.enum.ts
export enum OrderStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Cancelled = 'cancelled'
}
```

### `types/` - TypeScript Types

**Назначение**: Кастомные типы, не являющиеся моделями или enums.

**Примеры**:
```typescript
// common.types.ts
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

// api.types.ts
export type ApiResponse<T> = {
  data: T;
  message: string;
  status: number;
};
```

### `utils/` - Утилиты

**Назначение**: Вспомогательные функции, не привязанные к Angular.

**Примеры**:
```typescript
// date.utils.ts
export function formatDate(date: Date): string {
  return date.toLocaleDateString();
}

// string.utils.ts
export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + '...' : str;
}
```

### `config/` - Конфигурация

**Назначение**: Конфигурационные файлы и константы.

**Примеры**:
- `api.config.ts` - URL endpoints API
- `app.config.ts` - настройки приложения
- `constants.ts` - константы приложения

### `data/` - Статические данные

**Назначение**: Статические данные, моки для разработки.

**Примеры**:
- `mock-users.ts` - моки пользователей для тестов
- `countries.ts` - список стран
- `menu-items.ts` - пункты меню

### `modules/` - Feature Modules

**Назначение**: Логическое разделение приложения на модули.

**Примеры**:
- `admin/` - модуль администрирования
- `dashboard/` - модуль дашборда
- `shared/` - общие компоненты и директивы

## 📐 Правила именования

### Компоненты
- Формат: `<name>.component.ts`
- Класс: `<Name>Component`
- Selector: `app-<name>`

### Сервисы
- Формат: `<name>.service.ts`
- Класс: `<Name>Service`

### Guards
- Формат: `<name>.guard.ts`
- Класс: `<Name>Guard`

### Directives
- Формат: `<name>.directive.ts`
- Класс: `<Name>Directive`
- Selector: `app<Name>`

### Pipes
- Формат: `<name>.pipe.ts`
- Класс: `<Name>Pipe`
- Name: `<name>`

## ✅ Best Practices

1. **Один файл - одна ответственность**: Не смешивайте разную логику в одном файле.

2. **Используйте barrel files** (`index.ts`): Упрощает импорты.

3. **Lazy loading**: Используйте для больших модулей.

4. **Smart & Dumb components**:
   - Smart (контейнеры) - работают с сервисами
   - Dumb (презентационные) - получают данные через `@Input()`

5. **Unsubscribe**: Всегда отписывайтесь от Observable в `ngOnDestroy`.

6. **TypeScript strict mode**: Используйте строгую типизацию.

7. **Reactive Forms**: Предпочитайте реактивные формы template-driven.

## 🔗 Связь с Backend

Frontend структура должна отражать backend:

```
Frontend                    Backend
├── models/entities/   ←→   schemas/
├── models/contracts/  ←→   dto/
├── services/          ←→   controllers/
└── guards/            ←→   guards/
```

## 🚀 Добавление новой функциональности

### Новая страница
1. Создайте папку в `pages/`: `ng g c pages/new-page`
2. Добавьте роут в `app-routing.module.ts`
3. Создайте сервис если нужно: `ng g s services/new-service`

### Новая модель
1. Entity: `models/entities/new-entity.entity.ts`
2. Contracts: `models/contracts/new-module.contracts.ts`
3. Экспорт в `models/index.ts`

### Новый сервис
1. Создайте сервис: `ng g s services/new-service`
2. Добавьте методы для работы с API
3. Используйте типы из `models/`

---

*Эта структура обеспечивает масштабируемость, поддерживаемость и чистоту кода.*
