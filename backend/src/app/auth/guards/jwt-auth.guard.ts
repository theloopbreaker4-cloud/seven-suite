/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: jwt-auth.guard.ts
 * Description: JWT authentication guard - protects routes requiring valid JWT token
 * Created: 2025-10-26
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard - guard for JWT authentication strategy
 * @remarks Use this guard to protect routes that require authentication
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
