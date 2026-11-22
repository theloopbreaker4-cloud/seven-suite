# Admin browser tests

Playwright scenarios against a running API (`:4000`) and admin (`nx serve admin`, `:4200`):

| File | Covers |
|---|---|
| `admin-smoke.mjs` | sign-up, members, invitation by email, reload keeps the session, language/theme, sign-out/in, email verification |
| `security-e2e.mjs` | two-factor setup with QR + recovery codes, sign-in with a code, API key create/use/revoke |
| `org-e2e.mjs` | organization settings, custom roles, System → Queues (operator) |

```bash
docker compose -f docker/compose.dev.yml up -d
PLATFORM_ADMINS=ops-e2e@e2e.seven pnpm exec nx serve api   # terminal 1
pnpm exec nx serve admin                                   # terminal 2
MAILPIT=http://127.0.0.1:8026 node e2e/admin/run-all.mjs   # terminal 3
```

CI runs the same files (see `.github/workflows/ci.yml`, step “Admin browser tests”).
