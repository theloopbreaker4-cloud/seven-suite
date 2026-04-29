/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: app.controller.ts
 * Description: Main application controller - handles root API endpoints
 * Created: 2025-10-26
 */

import { Controller, Get, UsePipes, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { UppercasePipe } from './pipes/uppercase.pipe';

/**
 * AppController - root API controller
 * @remarks Provides basic endpoints for API health check and testing
 */
@Controller({
  path: '',
  version: '1',
})
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Root endpoint - returns API status message in uppercase
   * @returns {string} API status message
   */
  @Get()
  @UsePipes(new UppercasePipe())
  getApi(): string {
    return this.appService.getApi('Version 1');
  }

  /**
   * Test endpoint with parameter - returns API status with custom text
   * @param {string} text - Custom text parameter
   * @returns {string} Combined API status and text in uppercase
   */
  @Get('test/:text')
  @UsePipes(new UppercasePipe())
  getApiParam(@Param('text') text: string): string {
    return this.appService.getApi() + '-' + text;
  }
}
