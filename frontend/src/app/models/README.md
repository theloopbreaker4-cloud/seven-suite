# Models Directory Structure

Эта папка содержит все модели данных для приложения, организованные по принципу разделения ответственности.

## 📁 Структура

```
models/
├── entities/          # Сущности (Entity) - модели данных из backend
├── contracts/         # Контракты (DTO) - Request/Response объекты для API
└── index.ts          # Barrel file для экспорта всех моделей
```

## 🏗️ Назначение папок

### `entities/` - Сущности

**Назначение**: Модели данных, которые представляют объекты из базы данных backend.

**Когда использовать**: Для описания структуры данных, которые приходят с сервера и используются в приложении.

**Примеры**:
- `user.entity.ts` - модель пользователя
- `product.entity.ts` - модель продукта
- `order.entity.ts` - модель заказа

**Пример кода**:
```typescript
// user.entity.ts
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### `contracts/` - Контракты (DTO)

**Назначение**: Data Transfer Objects - объекты для обмена данными между frontend и backend через API.

**Когда использовать**: Для описания структуры данных, которые отправляются на сервер (Request) или приходят с сервера (Response).

**Типы контрактов**:
1. **Request** - данные, которые отправляются на backend
2. **Response** - данные, которые приходят с backend

**Примеры**:
- `auth.contracts.ts` - контракты для авторизации (LoginRequest, LoginResponse, RegisterRequest, etc.)
- `user.contracts.ts` - контракты для операций с пользователями

**Пример кода**:
```typescript
// auth.contracts.ts
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}
```

## 📋 Правила именования

### Entities
- Формат: `<name>.entity.ts`
- Примеры: `user.entity.ts`, `product.entity.ts`
- Интерфейсы в PascalCase: `User`, `Product`

### Contracts
- Формат: `<module>.contracts.ts`
- Примеры: `auth.contracts.ts`, `user.contracts.ts`
- Интерфейсы с суффиксами `Request` или `Response`: `LoginRequest`, `LoginResponse`

## 🔄 Импорт моделей

### Через Barrel File (Рекомендуется)
```typescript
// Импорт через index.ts
import { User, LoginRequest, LoginResponse } from '@app/models';
```

### Прямой импорт
```typescript
// Прямой импорт
import { User } from '@app/models/entities/user.entity';
import { LoginRequest } from '@app/models/contracts/auth.contracts';
```

## ✅ Best Practices

1. **Разделяйте сущности и контракты**: Не смешивайте модели данных (entities) с DTO (contracts).

2. **Используйте TypeScript интерфейсы**: Для моделей используйте `interface` вместо `class`, если не нужна логика.

3. **Добавляйте опциональные поля**: Используйте `?` для полей, которые могут отсутствовать.

4. **Документируйте модели**: Добавляйте JSDoc комментарии для описания назначения полей.

5. **Группируйте связанные контракты**: Храните все контракты одного модуля в одном файле (например, все auth-контракты в `auth.contracts.ts`).

## 📝 Примеры использования

### В сервисах
```typescript
import { User } from '../models/entities/user.entity';
import { LoginRequest, LoginResponse } from '../models/contracts/auth.contracts';

@Injectable()
export class AuthService {
  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', data);
  }
}
```

### В компонентах
```typescript
import { User } from '../../models/entities/user.entity';

export class ProfileComponent {
  user: User | null = null;

  ngOnInit() {
    this.authService.currentUser.subscribe((user: User | null) => {
      this.user = user;
    });
  }
}
```

## 🔗 Связь с Backend

Модели должны соответствовать структуре данных на backend:

- **Entities** → соответствуют моделям в `backend/src/app/schemas/`
- **Contracts** → соответствуют DTO в `backend/src/app/dto/`

## 🚀 Расширение структуры

При добавлении новых модулей:

1. Создайте entity файл: `models/entities/new-entity.entity.ts`
2. Создайте contracts файл: `models/contracts/new-module.contracts.ts`
3. Экспортируйте в `models/index.ts`:
```typescript
export * from './entities/new-entity.entity';
export * from './contracts/new-module.contracts';
```

---

*Эта структура обеспечивает чистую архитектуру и легкую поддержку кода.*
