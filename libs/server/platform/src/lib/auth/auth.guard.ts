/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { RequestContext } from '../context/request-context';
import { DomainError } from '../errors/domain-error';
import { IS_PUBLIC, REQUIRED_PERMISSION } from './decorators';
import { hasPermission } from './permissions';
import { TokenService, type AuthContext } from './tokens';

/**
 * Global guard: deny by default. A route is reachable only if it is @Public() or the caller
 * presents a valid access token; @RequirePermission() additionally checks the role's grants.
 * Services re-check record-level rules themselves.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets))
      return true;

    const req = context
      .switchToHttp()
      .getRequest<Request & { auth?: AuthContext }>();
    const header = req.headers.authorization ?? '';
    const match = /^Bearer\s+(\S+)$/i.exec(header);
    const auth = match ? await this.tokens.verifyAccess(match[1]) : null;
    if (!auth) throw DomainError.unauthorized();
    req.auth = auth;
    RequestContext.patch({ userId: auth.userId, orgId: auth.orgId, actorType: 'user' });

    const required = this.reflector.getAllAndOverride<string | undefined>(
      REQUIRED_PERMISSION,
      targets,
    );
    if (required && !hasPermission(auth.permissions, required))
      throw DomainError.forbidden();
    return true;
  }
}
