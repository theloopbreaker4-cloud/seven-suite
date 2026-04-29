# SevenCMS — Angular.io

See [workspace CLAUDE.md](../../CLAUDE.md)

## Stack

- Frontend: Angular 20 + Tailwind v4 — port 4200
- Backend: NestJS 11 + MongoDB + Redis + Socket.IO 4.x + JWT — port 3000

## Structure

```
sevenAngular.io/
├── frontend/src/app/
│   ├── components/    # shared UI
│   ├── pages/         # page components
│   └── services/      # i18n, auth, etc.
└── backend/src/app/
    ├── auth/          # JWT module
    ├── controllers/
    ├── services/
    ├── schemas/       # Mongoose
    └── websockets/    # Socket.IO gateway
```

## Rules

- Standalone components, Signals, strict typing, no `any`
- NestJS: DTOs + class-validator, Swagger decorators, error filters
- `npm run move:shared` after changes to `/shared`

## Dev

```bash
cd frontend && npm run start    # port 4200
cd backend && npm run start:dev # port 3000
```
