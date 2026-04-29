/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: context.middleware.ts
 * Description: Middleware that manages request context using CLS (Continuation-Local Storage) for tracking request-specific data
 * Created: 2025-10-26
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createNamespace } from 'cls-hooked';

/**
 * Middleware for managing request context across async operations
 */
@Injectable()
export class ContextMiddleware implements NestMiddleware {
  private readonly namespace = createNamespace('app-namespace');

  /**
   * Sets up the CLS namespace and stores request context data
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  use(req: Request, res: Response, next: NextFunction) {
    this.namespace.run(() => {
      // Set context variables
      this.namespace.set('requestId', req.headers['x-request-id'] || '');

      next();
    });
  }
}
