/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: auth-config.controller.ts
 * Description: Controller for checking available OAuth providers
 * Created: 2025-11-02
 */

import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * AuthConfigController - provides OAuth availability info
 */
@Controller('auth/config')
export class AuthConfigController {
  constructor(private configService: ConfigService) {}

  /**
   * Get available OAuth providers
   * @returns Object with available providers
   */
  @Get('providers')
  getAvailableProviders() {
    const googleEnabled = !!(
      this.configService.get('GOOGLE_CLIENT_ID') &&
      this.configService.get('GOOGLE_CLIENT_SECRET')
    );

    const facebookEnabled = !!(
      this.configService.get('FACEBOOK_APP_ID') &&
      this.configService.get('FACEBOOK_APP_SECRET')
    );

    const githubEnabled = !!(
      this.configService.get('GITHUB_CLIENT_ID') &&
      this.configService.get('GITHUB_CLIENT_SECRET')
    );

    const discordEnabled = !!(
      this.configService.get('DISCORD_CLIENT_ID') &&
      this.configService.get('DISCORD_CLIENT_SECRET')
    );

    const telegramEnabled = !!this.configService.get('TELEGRAM_BOT_TOKEN');

    return {
      google: googleEnabled,
      facebook: facebookEnabled,
      github: githubEnabled,
      discord: discordEnabled,
      telegram: telegramEnabled,
    };
  }
}
