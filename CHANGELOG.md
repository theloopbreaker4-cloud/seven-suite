# Changelog

All notable changes to Seven Suite. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versions: [Semantic Versioning](https://semver.org/) (0.x — APIs may still change between minors).

## [Unreleased]

## [0.1.0] — 2026-11-22 — Foundation preview

The platform kernel every module will build on, live as a public demo at
https://seven.toolpix.dev/suite/ (`demo@example.com` / `seven-demo-2026`, reset hourly).

### Added

- **Workspace** — NX 24 monorepo (pnpm): NestJS API + worker, Angular 22 admin, Next.js 16 web,
  shared libraries; lint-enforced module boundaries; Docker dev services (PostgreSQL 16, Redis 7,
  S3, Mailpit); CI with unit and integration tests.
- **Platform kernel** — zod-validated config that fails fast, PostgreSQL with row-level security
  per organization, structured logging with request ids and credential redaction, one error
  format (`{ error, code, fields }`), health probes.
- **Identity** — sign-up (creates the organization and its owner/admin/member roles), login,
  logout, email verification, password reset, invitations, switching organizations.
- **Sessions** — 15-minute JWT access tokens + rotating refresh tokens in an httpOnly
  `SameSite=Strict` cookie; reusing a refresh token revokes the whole session family.
- **Members & roles** — list members, change roles, remove, pending invitations; permissions as
  `module:entity:action` with wildcards; you can't grant more than you have.
- **Admin** — Angular shell with permission-filtered navigation, sign-in flows, members page,
  light/dark themes, English / Russian / Georgian UI.
- **Public demo mode** — `DEMO_MODE` shows the shared account on the sign-in page and locks
  sign-up, mail, credential and membership changes (`403 demo_locked`); hourly reset.
- **Deploy** — API Docker image built on the server, served under a path prefix
  (`PUBLIC_BASE_PATH=/suite`), nightly database backups with restore drills.

### Security

- Deny-by-default guard (`@Public()` / `@RequirePermission()`), scrypt password hashes,
  timing-safe login for unknown emails, CSRF header on cookie-authenticated endpoints.
- Login rate limits in Redis: 5 failures per account and IP, 30 per IP, per 15 minutes.
- API responses: `Content-Security-Policy: default-src 'none'`, `nosniff`, `X-Frame-Options:
DENY`, `Cache-Control: no-store`, no CORS. Admin: strict CSP (`script-src 'self'`), HSTS.

[Unreleased]: https://github.com/theloopbreaker4-cloud/seven-suite/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/theloopbreaker4-cloud/seven-suite/releases/tag/v0.1.0
