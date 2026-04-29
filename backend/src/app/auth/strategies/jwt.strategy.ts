/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: jwt.strategy.ts
 * Description: JWT Passport strategy - validates JWT tokens from Authorization header
 * Created: 2025-10-26
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * JwtStrategy - Passport strategy for JWT authentication
 * @remarks Extracts JWT from Bearer token and validates signature
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'defaultSecret123',
    });
  }

  /**
   * Validates JWT payload and attaches user info to request
   * @param payload - Decoded JWT payload
   * @returns User object with userId and email
   */
  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}
