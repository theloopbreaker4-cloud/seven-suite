# Workflow

## Status: planning

This folder is being repurposed. Until the rewrite begins, **don't extend the legacy CMS-clone code** in `frontend/` or `backend/`. Read it for reference, plan the replacement, but don't add features that would have to be migrated later.

## When ready to start the rewrite

The plan is to **scaffold an NX monorepo from scratch** in a fresh subfolder, then gradually move/discard the legacy code.

```bash
# in d:\Works\SevenCMSProjects\sevenAngular.io
npx create-nx-workspace@latest suite \
  --preset=angular-monorepo \
  --appName=crm \
  --style=scss \
  --packageManager=npm

cd suite
# add the other apps
nx generate @nx/angular:application billing
nx generate @nx/angular:application erp
nx generate @nx/nest:application api

# shared libs
nx generate @nx/angular:library shared --buildable
nx generate @nx/angular:library ui --buildable
nx generate @nx/angular:library auth --buildable
nx generate @nx/angular:library api-client --buildable
```

The `suite/` subfolder becomes the new home. Legacy `frontend/` and `backend/` get deleted once enough of the new code exists.

## Common commands (after NX bootstrap)

```bash
nx serve crm                       # http://localhost:4200
nx serve billing                   # http://localhost:4201 (NX assigns next port)
nx serve erp
nx serve api                       # http://localhost:3000

nx test <project>                  # run tests for one project
nx affected:test                   # run tests for changed projects
nx build <project> --prod
nx graph                           # visual dependency graph
```

## Adding a new domain module (NestJS)

```bash
nx generate @nx/nest:module crm/pipeline --project=api
nx generate @nx/nest:service crm/pipeline --project=api
nx generate @nx/nest:controller crm/pipeline --project=api
```

Then in the parent module file (e.g. `crm.module.ts`) import the new module.

## Adding a new shared model

1. `libs/shared/src/lib/models/foo.model.ts` — TypeScript interface
2. `libs/shared/src/index.ts` — re-export it
3. Both NestJS (`apps/api/...`) and Angular (`apps/crm/...`) can `import { Foo } from '@suite/shared'`

## Database

- **Local:** MongoDB in WSL Docker. Connection string in `.env`.
- **Production:** MongoDB Atlas (or self-hosted replica set for transactions).

```bash
# WSL Docker
docker run -d --name suite-mongo -p 27017:27017 mongo:7
```

## Auth flow

1. User POSTs `/api/auth/login` with email/password
2. Server returns JWT (access, 15 min) + refresh token (30 days)
3. Frontend stores access token in memory, refresh in `httpOnly` cookie (or localStorage if SPA-only)
4. `AuthInterceptor` attaches `Authorization: Bearer <access>` to every API call
5. On 401, interceptor calls `/api/auth/refresh`, retries the original request
6. Logout: revoke refresh token server-side, clear client state

## Deployment

TBD when MVP is real. Likely:

- API: Node.js on a VPS or Render/Railway. Behind nginx reverse proxy.
- Apps: built static, served from a CDN (Cloudflare Pages, Netlify, or nginx).
- DB: MongoDB Atlas.
- Background workers (dunning, period close, webhook processing): same Node process for now, separate worker process when traffic warrants.

## Don't

- Don't replicate sevenPHP's CSRF guard. JWT in `Authorization` header is sufficient — CSRF doesn't apply to that pattern.
- Don't replicate sevenPHP's PHP-session-based RateLimit. Use Redis-backed rate limiting (NestJS has `@nestjs/throttler` with Redis store).
- Don't try to "share code with sevenPHP." Different language, different runtime — only conventions are shared (money in minor units, i18n object shape, theme tokens).
- Don't ship CRM/Billing/ERP as one bundle. Separate Angular apps so users don't load JS they can't access.
