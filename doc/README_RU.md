# Seven Project - Angular + NestJS Full-Stack Application

**Project enhanced by: prgera**
**Author**: TheLoopBreaker <the.loop.breaker4@gmail.com>
**Version**: 1.3.2
**Last Updated**: 2025-10-26

---

## О проекте

Seven - это полнофункциональное web-приложение, построенное на современном стеке технологий:
- **Frontend**: Angular 20+ с Server-Side Rendering (SSR)
- **Backend**: NestJS 11+ с WebSocket поддержкой
- **Database**: MongoDB через Mongoose ODM
- **Authentication**: JWT-based authentication с Passport strategies

Проект включает базовую аутентификацию, real-time коммуникацию через WebSockets и монолитную архитектуру с раздельными frontend/backend модулями.

---

## Технологический стек

### Frontend
- **Angular**: 20.0.4
- **Angular Material**: 20.0.3
- **RxJS**: 7.8.0
- **TypeScript**: 5.8.3
- **Express**: Server-side rendering support
- **LESS**: CSS preprocessor

### Backend
- **NestJS**: 11.1.3
- **Mongoose**: 8.9.5 (MongoDB ODM)
- **Passport**: JWT & Local strategies
- **Socket.IO**: 4.8.1 (WebSocket)
- **Swagger**: API documentation
- **bcrypt**: Password hashing
- **TypeScript**: 5.8.3

### DevOps & Tools
- **Gulp**: 5.0.0 - автоматизация задач (shared folder sync)
- **ESLint**: 9.20.0 - линтинг кода
- **Prettier**: 3.4.2 - форматирование кода
- **Jest**: 29.7.0 - unit/e2e тестирование
- **PM2**: production process manager

---

## Установка и запуск

### Требования
- **Node.js**: >= 20.0.0 < 23
- **npm**: >= 8.0.0
- **MongoDB**: >= 5.0 (running instance)

### Шаг 1: Установка зависимостей

```bash
npm run install:all
```

Или по отдельности:

```bash
# Root
npm install

# Frontend
cd frontend && npm install

# Backend
cd backend && npm install
```

### Шаг 2: Настройка окружения

Создайте файл `.env` в `backend/`:

```env
PORT=3000
API_PATH=api
API_VERSION=v1
DATABASE_HOST=mongodb://localhost:27017/
DATABASE_NAME=seven_db
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
```

### Шаг 3: Синхронизация shared папки

```bash
npm run move:shared
```

### Шаг 4: Запуск

**Frontend** (http://localhost:4200):
```bash
npm run ng:start
```

**Backend** (http://localhost:3000/api/v1):
```bash
npm run nest:start
```

---

## Основные команды

### Root
```bash
npm run move:shared      # Синхронизация shared
npm run watch           # Watch режим
npm run format          # Форматирование
npm run lint            # Линтинг
```

### Frontend
```bash
cd frontend
npm run start           # Dev server
npm run build           # Production build
npm run test            # Tests
```

### Backend
```bash
cd backend
npm run start:dev       # Dev server
npm run build           # Build
npm run test            # Tests
npm run start:pm2       # PM2 start
```

---

## API Документация

### Swagger UI
Development: `http://localhost:3000/api/v1/`

### Authentication

**POST** `/api/v1/auth/register`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**POST** `/api/v1/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Protected Routes
Добавьте заголовок:
```
Authorization: Bearer <access_token>
```

---

## Изменения (prgera - 2025-10-26)

### Обновления зависимостей
- Angular 20.0.4 (LTS)
- NestJS 11.1.3 (LTS)
- Mongoose 8.9.5
- TypeScript 5.8.3
- ESLint/Prettier latest

### Новые возможности
- JWT аутентификация с Passport
- bcrypt для паролей
- Auth guards
- Prettier + ESLint
- Полная документация

### Улучшения
- JSDoc комментарии
- File headers
- Единый стиль кода
- Улучшенная структура

---

## Roadmap

- [ ] User CRUD операции
- [ ] Refresh tokens
- [ ] Role-based access control
- [ ] Email verification
- [ ] Password reset
- [ ] Frontend auth service
- [ ] Tests coverage > 80%
- [ ] Docker
- [ ] CI/CD

---

## Контакты

**Author**: TheLoopBreaker (prgera)
**Email**: the.loop.breaker4@gmail.com

---

## Лицензия

ISC License - Copyright (c) 2025 TheLoopBreaker

---

**Note**: Проект в активной разработке. Базовая аутентификация требует доработки перед production.
