/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: local-auth.guard.ts
 * Description: Local authentication guard - protects login endpoint with local strategy
 * Created: 2025-10-26
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * LocalAuthGuard - guard for local authentication strategy
 * @remarks Uses Passport local strategy to validate email/password
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
