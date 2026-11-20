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

/** Every route requires a signed-in caller unless marked public. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Require a permission (`module:entity:action`) on top of being signed in. */
export const RequirePermission = (permission: string) =>
  SetMetadata(REQUIRED_PERMISSION, permission);

/** The authenticated caller, attached by AuthGuard. */
export const CurrentAuth = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthContext =>
    ctx.switchToHttp().getRequest<Request & { auth: AuthContext }>().auth,
);
