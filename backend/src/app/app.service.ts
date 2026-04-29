/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: app.service.ts
 * Description: Main application service providing basic API information
 * Created: 2025-10-26
 */

import { Injectable } from '@nestjs/common';

/**
 * AppService - provides basic API functionality
 * @remarks Contains methods for retrieving general API information
 */
@Injectable()
export class AppService {
  /**
   * Returns API welcome message
   * @returns {string} Rest API greeting
   */
  getApi(text?: string): string {
    return `Rest API ${text||''}`;
  }
}
