/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { RequestContext } from '../context/request-context';
import { DomainError } from '../errors/domain-error';
import { ApiKeyService, API_KEY_PREFIX } from './api-key.service';
import { timingSafeEqual } from 'node:crypto';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import { IS_PUBLIC, REQUIRED_MODULE, REQUIRED_PERMISSION, SERVICE_ONLY, USER_ONLY } from './decorators';
import { ModuleRegistry } from '../modules/module-registry';
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
    private readonly apiKeys: ApiKeyService,
    private readonly modules: ModuleRegistry,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(SERVICE_ONLY, targets)) {
      const req = context.switchToHttp().getRequest<Request>();
      const given = Buffer.from(String(req.headers['x-service-key'] ?? ''));
      const expected = Buffer.from(this.env.WEB_SERVICE_KEY);
      if (given.length !== expected.length || !timingSafeEqual(given, expected))
        throw DomainError.unauthorized('Service key required', 'service_key_required');
      RequestContext.patch({ actorType: 'system' });
      return true;
    }
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets))
      return true;

    const req = context
      .switchToHttp()
      .getRequest<Request & { auth?: AuthContext }>();
    // Either a session access token or an API key (`Authorization: Bearer sv_…` or `X-Api-Key`).
    const header = req.headers.authorization ?? '';
    const bearer = /^Bearer\s+(\S+)$/i.exec(header)?.[1];
    const xKey = req.headers['x-api-key'];
    const apiKey = typeof xKey === 'string' ? xKey : bearer?.startsWith(API_KEY_PREFIX) ? bearer : undefined;
    const auth = apiKey
      ? await this.apiKeys.authenticate(apiKey)
      : bearer
        ? await this.tokens.verifyAccess(bearer)
        : null;
    if (!auth) throw DomainError.unauthorized();
    if (auth.apiKeyId && this.reflector.getAllAndOverride<boolean>(USER_ONLY, targets))
      throw DomainError.forbidden('Not available with an API key', 'api_key_not_allowed');
    req.auth = auth;
    RequestContext.patch({
      userId: auth.userId,
      orgId: auth.orgId,
      actorType: auth.apiKeyId ? 'api_key' : 'user',
      apiKeyId: auth.apiKeyId,
    });

    const required = this.reflector.getAllAndOverride<string | undefined>(
      REQUIRED_PERMISSION,
      targets,
    );
    if (required && !hasPermission(auth.permissions, required))
      throw DomainError.forbidden();
    const moduleId = this.reflector.getAllAndOverride<string | undefined>(REQUIRED_MODULE, targets);
    if (moduleId && !(await this.modules.isEnabled(auth.orgId, moduleId)))
      throw DomainError.forbidden('This module is not enabled for your organization', 'module_disabled');
    return true;
  }
}
