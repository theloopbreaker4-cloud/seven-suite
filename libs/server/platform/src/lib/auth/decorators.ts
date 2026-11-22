/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthContext } from './tokens';

export const IS_PUBLIC = 'seven:public';
export const REQUIRED_PERMISSION = 'seven:permission';
export const DEMO_LOCKED = 'seven:demo-locked';
export const USER_ONLY = 'seven:user-only';
export const REQUIRED_MODULE = 'seven:module';
export const SERVICE_ONLY = 'seven:service-only';

/** Every route requires a signed-in caller unless marked public. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Require a permission (`module:entity:action`) on top of being signed in. */
export const RequirePermission = (permission: string) =>
  SetMetadata(REQUIRED_PERMISSION, permission);

/**
 * Disabled on the public demo (DEMO_MODE): anything that sends mail, changes credentials or
 * changes who belongs to the shared demo organization.
 */
export const DemoLocked = () => SetMetadata(DEMO_LOCKED, true);

/**
 * Only a signed-in person, never an API key: sessions, two-factor settings, API key management.
 * (A leaked key must not be able to mint more keys or change how anyone signs in.)
 */
export const UserOnly = () => SetMetadata(USER_ONLY, true);

/**
 * Server-to-server only: the Next.js storefront calls these with `X-Service-Key` (WEB_SERVICE_KEY).
 * Not reachable by browsers, users or API keys.
 */
export const ServiceOnly = () => SetMetadata(SERVICE_ONLY, true);

/** The route belongs to a domain module: `403 module_disabled` unless the organization enabled it. */
export const RequireModule = (id: string) => SetMetadata(REQUIRED_MODULE, id);

/** The authenticated caller, attached by AuthGuard. */
export const CurrentAuth = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthContext =>
    ctx.switchToHttp().getRequest<Request & { auth: AuthContext }>().auth,
);
