/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: oauth.config.ts
 * Description: OAuth2 configuration for social login providers
 * Created: 2025-11-02
 */

import { ConfigService } from '@nestjs/config';

export interface OAuthConfig {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope?: string[];
}

export class OAuthConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * Get Google OAuth configuration
   */
  getGoogleConfig(): OAuthConfig {
    return {
      clientID: this.configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: this.configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    };
  }

  /**
   * Get Facebook OAuth configuration
   */
  getFacebookConfig(): OAuthConfig {
    return {
      clientID: this.configService.get<string>('FACEBOOK_APP_ID') || '',
      clientSecret: this.configService.get<string>('FACEBOOK_APP_SECRET') || '',
      callbackURL: this.configService.get<string>('FACEBOOK_CALLBACK_URL'),
      scope: ['email', 'public_profile'],
    };
  }

  /**
   * Get GitHub OAuth configuration
   */
  getGitHubConfig(): OAuthConfig {
    return {
      clientID: this.configService.get<string>('GITHUB_CLIENT_ID') || '',
      clientSecret: this.configService.get<string>('GITHUB_CLIENT_SECRET') || '',
      callbackURL: this.configService.get<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    };
  }

  /**
   * Get Discord OAuth configuration
   */
  getDiscordConfig(): OAuthConfig {
    return {
      clientID: this.configService.get<string>('DISCORD_CLIENT_ID') || '',
      clientSecret: this.configService.get<string>('DISCORD_CLIENT_SECRET') || '',
      callbackURL: this.configService.get<string>('DISCORD_CALLBACK_URL'),
      scope: ['identify', 'email'],
    };
  }

  /**
   * Get OAuth frontend callback URL
   */
  getFrontendCallbackURL(): string {
    return this.configService.get<string>('OAUTH_FRONTEND_CALLBACK');
  }
}
