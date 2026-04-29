/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: redirect.middleware.ts
 * Description: Middleware that redirects root URL requests to the global API prefix
 * Created: 2025-10-26
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppConfigService } from '../config/config.service';

/**
 * Middleware for handling root URL redirection to API prefix
 */
@Injectable()
export class RedirectMiddleware implements NestMiddleware {
    constructor(private readonly configService: AppConfigService) { }

    /**
     * Handles the redirect logic for root URL requests
     * @param req - Express request object
     * @param res - Express response object
     * @param next - Express next function
     */
    use(req: Request, res: Response, next: NextFunction) {
        const globalPrefix = this.configService.getGlobalPrefix();
        if (req.originalUrl === '/') {
            res.redirect(globalPrefix);
        } else {
            next();
        }
    }
}