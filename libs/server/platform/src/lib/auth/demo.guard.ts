/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import { DomainError } from '../errors/domain-error';
import { DEMO_LOCKED } from './decorators';

/** On the public demo, refuses routes marked @DemoLocked(); a no-op everywhere else. */
@Injectable()
export class DemoGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(ENV) private readonly env: Env,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.env.DEMO_MODE) return true;
    const locked = this.reflector.getAllAndOverride<boolean>(DEMO_LOCKED, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (locked)
      throw DomainError.forbidden(
        'This is disabled in the demo. Everything else is yours to try — data resets every hour.',
        'demo_locked',
      );
    return true;
  }
}
