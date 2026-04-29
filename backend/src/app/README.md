# 🔗 Shared Directory

Общая папка для кода, используемого **как на frontend (Angular), так и на backend (NestJS)**.

## ⚠️ ВАЖНЫЕ ПРАВИЛА

### 🚫 НЕЛЬЗЯ изменять внутри backend или frontend!

Все файлы в папке `shared/` должны редактироваться **ТОЛЬКО здесь**.

**Backend и Frontend импортируют эти файлы напрямую из shared папки.**

```
❌ НЕПРАВИЛЬНО:
backend/src/app/enums/user-role.enum.ts  // Дублирование!
frontend/src/app/enums/user-role.enum.ts // Дублирование!

✅ ПРАВИЛЬНО:
shared/enums/user-role.enum.shared.ts    // Один источник истины!
```

## 📁 Структура

```
shared/
├── enums/              # Перечисления (enum)
│   └── user.enum.shared.ts
├── types/              # TypeScript типы и интерфейсы
│   └── api.types.shared.ts
├── utils/              # Утилиты и helper функции
│   └── validation.utils.shared.ts
├── constants/          # Константы
│   └── api.constants.shared.ts
└── README.md          # Документация
```

## 🎯 Назначение папок

### `enums/` - Перечисления

**Что хранить**: Enum с фиксированным набором значений.

**Примеры**:
- Роли пользователей (Admin, User, Guest)
- Статусы заказов (Pending, Processing, Completed)
- Типы уведомлений (Info, Warning, Error)

**Именование**: `<name>.enum.shared.ts`

**Пример**:
```typescript
// user-role.enum.shared.ts
/**
 * ⚠️ SHARED FILE - DO NOT MODIFY IN BACKEND OR FRONTEND
 * Edit only in: shared/enums/user-role.enum.shared.ts
 */
export enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest'
}
```

### `types/` - Типы и интерфейсы

**Что хранить**: TypeScript типы, интерфейсы, type aliases, которые используются и на backend, и на frontend.

**Примеры**:
- Структуры ответов API
- Общие интерфейсы данных
- Type guards
- Utility types

**Именование**: `<name>.types.shared.ts`

**Пример**:
```typescript
// api.types.shared.ts
/**
 * ⚠️ SHARED FILE - DO NOT MODIFY IN BACKEND OR FRONTEND
 * Edit only in: shared/types/api.types.shared.ts
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: number;
}

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
```

### `utils/` - Утилиты

**Что хранить**: Чистые функции (pure functions) без зависимостей от Angular или NestJS.

**Примеры**:
- Валидация данных
- Форматирование строк, дат, чисел
- Математические расчеты
- Преобразование данных

**Именование**: `<name>.utils.shared.ts`

**Пример**:
```typescript
// validation.utils.shared.ts
/**
 * ⚠️ SHARED FILE - DO NOT MODIFY IN BACKEND OR FRONTEND
 * Edit only in: shared/utils/validation.utils.shared.ts
 */

/**
 * Проверяет валидность email адреса
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Проверяет силу пароля
 */
export function isStrongPassword(password: string): boolean {
  return password.length >= 8 &&
         /[A-Z]/.test(password) &&
         /[a-z]/.test(password) &&
         /[0-9]/.test(password) &&
         /[^A-Za-z0-9]/.test(password);
}
```

### `constants/` - Константы

**Что хранить**: Константные значения, используемые в обоих приложениях.

**Примеры**:
- Регулярные выражения
- Лимиты (максимальная длина, размер файла)
- Коды ошибок
- Дефолтные значения

**Именование**: `<name>.constants.shared.ts`

**Пример**:
```typescript
// validation.constants.shared.ts
/**
 * ⚠️ SHARED FILE - DO NOT MODIFY IN BACKEND OR FRONTEND
 * Edit only in: shared/constants/validation.constants.shared.ts
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
```

## 🔧 Как использовать в проектах

### В Backend (NestJS)

```typescript
// backend/src/app/schemas/user.schema.ts
import { UserRole } from '../../../shared/enums/user.enum.shared';

@Schema()
export class User {
  @Prop({ type: String, enum: UserRole, default: UserRole.User })
  role: UserRole;
}
```

```typescript
// backend/src/app/services/auth.service.ts
import { isValidEmail } from '../../../shared/utils/validation.utils.shared';
import { PASSWORD_MIN_LENGTH } from '../../../shared/constants/validation.constants.shared';

export class AuthService {
  validateCredentials(email: string, password: string) {
    if (!isValidEmail(email)) {
      throw new BadRequestException('Invalid email');
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }
  }
}
```

### В Frontend (Angular)

```typescript
// frontend/src/app/models/entities/user.entity.ts
import { UserRole } from '../../../../shared/enums/user.enum.shared';

export interface User {
  id: string;
  email: string;
  role: UserRole;  // Используем shared enum
}
```

```typescript
// frontend/src/app/services/validation.service.ts
import { isValidEmail, isStrongPassword } from '../../../shared/utils/validation.utils.shared';

@Injectable()
export class ValidationService {
  validateEmail(email: string): boolean {
    return isValidEmail(email);
  }

  validatePassword(password: string): boolean {
    return isStrongPassword(password);
  }
}
```

## 📋 Шаблон файла

Каждый shared файл должен начинаться с этого комментария:

```typescript
/**
 * ⚠️ SHARED FILE - DO NOT MODIFY IN BACKEND OR FRONTEND
 *
 * Source: shared/<folder>/<filename>
 * Used by: Backend, Frontend
 *
 * Edit only in shared directory!
 * Changes here will affect both applications.
 */
```

## ✅ Что МОЖНО хранить в shared

✅ Enums (перечисления)
✅ TypeScript типы и интерфейсы
✅ Константы
✅ Чистые функции (pure functions)
✅ Валидаторы
✅ Утилиты для работы со строками, датами, числами
✅ Регулярные выражения
✅ Математические функции

## ❌ Что НЕЛЬЗЯ хранить в shared

❌ Angular-специфичный код (@Component, @Injectable, etc.)
❌ NestJS-специфичный код (@Controller, @Injectable, etc.)
❌ Зависимости от библиотек (RxJS, Mongoose, etc.)
❌ HTTP клиенты
❌ Классы с внедрением зависимостей (DI)
❌ Декораторы специфичные для фреймворков

## 🔄 Workflow изменений

### Добавление нового shared файла:

1. Создайте файл в соответствующей папке shared:
   ```bash
   touch shared/enums/order-status.enum.shared.ts
   ```

2. Добавьте обязательный комментарий в начало файла

3. Экспортируйте в barrel file (если есть)

4. Используйте в backend и frontend через импорт

### Изменение существующего shared файла:

1. Откройте файл в `shared/` папке
2. Внесите изменения
3. Протестируйте в backend: `cd backend && npm run test`
4. Протестируйте в frontend: `cd frontend && npm run test`
5. Закоммитьте изменения

## 📦 Примеры использования

### Пример 1: Валидация на обоих сторонах

```typescript
// shared/utils/user-validation.utils.shared.ts
export function validateUserAge(age: number): boolean {
  return age >= 18 && age <= 120;
}

// Backend использует для валидации входящих данных
// Frontend использует для валидации форм
```

### Пример 2: Общие константы

```typescript
// shared/constants/pagination.constants.shared.ts
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// Backend использует для paginatio API
// Frontend использует для отображения списков
```

### Пример 3: Типы API ответов

```typescript
// shared/types/api-response.types.shared.ts
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Backend возвращает в таком формате
// Frontend ожидает в таком формате
```

## 🎯 Преимущества использования shared

1. **Единый источник истины** - нет дублирования кода
2. **Синхронизация** - изменения сразу в обоих приложениях
3. **Типобезопасность** - TypeScript гарантирует совместимость
4. **Легкая поддержка** - изменения в одном месте
5. **Избежание ошибок** - нет рассинхронизации между frontend и backend

## 🚀 Настройка путей импорта (опционально)

Для удобства можно настроить path aliases:

### Backend (tsconfig.json)
```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["../shared/*"]
    }
  }
}
```

### Frontend (tsconfig.json)
```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["../shared/*"]
    }
  }
}
```

Тогда импорты будут короче:
```typescript
import { UserRole } from '@shared/enums/user.enum.shared';
```

---

*Shared directory обеспечивает консистентность данных между frontend и backend.*
