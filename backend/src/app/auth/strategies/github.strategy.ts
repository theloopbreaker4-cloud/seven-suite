/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: github.strategy.ts
 * Description: GitHub OAuth2 authentication strategy
 * Created: 2025-11-01
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { OAuthConfigService } from '../../config/oauth.config';

/**
 * GitHubStrategy - implements GitHub OAuth2 authentication
 * @remarks Uses GitHub OAuth2.0 for social login
 */
@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    const oauthConfig = new OAuthConfigService(configService);
    const config = oauthConfig.getGitHubConfig();

    super({
      clientID: config.clientID,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      scope: config.scope,
    });
  }

  /**
   * Validates GitHub OAuth response and extracts user data
   * @param accessToken - GitHub access token
   * @param refreshToken - GitHub refresh token
   * @param profile - GitHub user profile
   * @param done - Passport callback
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { id, displayName, emails, photos } = profile;

    // Parse displayName into first and last name
    const nameParts = displayName?.split(' ') || ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const user = {
      provider: 'github',
      providerId: id,
      email: emails && emails.length > 0 ? emails[0].value : null,
      firstName,
      lastName,
      picture: photos && photos.length > 0 ? photos[0].value : null,
      accessToken,
    };

    done(null, user);
  }
}
