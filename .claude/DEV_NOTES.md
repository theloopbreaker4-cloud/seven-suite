# История изменений проекта Seven

> **Примечание**: Полное описание проекта в [README.md](README.md)

## 2025-12-11 - Первичный аудит проекта

### Выполнено:
1. **Аудит структуры проекта Seven v1.3.2**
   - Frontend: Angular 20 + SSR + Material UI + Socket.io
   - Backend: NestJS 11 + MongoDB + Redis + WebSocket + JWT
   - Shared: синхронизация через Gulp между frontend/backend

2. **Изучены ключевые файлы:**
   - [app.module.ts](frontend/src/app/app.module.ts:1) - 5 HTTP interceptors (порядок: Loading → Auth → Cache → Logging → Error)
   - [app-routing.module.ts](frontend/src/app/app-routing.module.ts:1) - Public/Protected + lazy loaded admin
   - [auth.module.ts](backend/src/app/auth/auth.module.ts:1) - JWT + 5 OAuth providers (Google, FB, GitHub, Discord, Telegram)
   - [gulpfile.js](gulpfile.js:1) - синхронизация `/shared` в frontend/backend

3. **Обновлены инструкции в [CLAUDE.md](CLAUDE.md:41-78):**
   - Добавлены 7 правил экономии токенов
   - Рекомендации по параллельным запросам
   - Task tool для exploration вместо ручного Glob/Grep
   - Избегать bash команд для файловых операций

### Ключевые находки:
- **OAuth**: Условная загрузка strategies через spread operator
- **WSL**: Docker с MongoDB + Redis (Ubuntu root/123)
- **Shared sync**: `npm run move:shared` или `npm run watch`
- **2FA**: Реализована через speakeasy + QR codes
- **WebSocket**: Полный функционал (см. [WEBSOCKET_GUIDE.md](WEBSOCKET_GUIDE.md))

### Вопросы для уточнения:
- Admin module (lazy loaded) - какой функционал?
- Redis использование - cache/sessions/rate limiting?
- Написаны ли тесты? (настройки jest/karma есть)

---

## 2025-12-11 - Запуск и настройка проекта

### Выполнено:
1. **Запущены Docker контейнеры в WSL:**
   - MongoDB (порт 27017) - `wsl -d Ubuntu -u root docker start mongodb`
   - Redis (порт 6379) - `wsl -d Ubuntu -u root docker start redis`

2. **Запущены серверы:**
   - Backend: http://localhost:3000/api/v1 (NestJS dev mode)
   - Frontend: http://localhost:4200 (Angular dev server)

3. **Настроен доступ к frontend извне:**
   - [package.json:13](frontend/package.json#L13) - добавлен `--host 0.0.0.0`
   - Доступно по IP: http://192.168.100.50:4200
   - Доступно по hosts: http://test.com:4200

### Команды для управления:
```bash
# Запуск Docker контейнеров
wsl -d Ubuntu -u root docker start mongodb redis

# Остановка Docker контейнеров
wsl -d Ubuntu -u root docker stop mongodb redis

# Проверка статуса
wsl -d Ubuntu -u root docker ps
```

---
