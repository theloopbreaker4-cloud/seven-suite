/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: google.strategy.ts
 * Description: Google OAuth2 authentication strategy
 * Created: 2025-11-01
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { OAuthConfigService } from '../../config/oauth.config';

/**
 * GoogleStrategy - implements Google OAuth2 authentication
 * @remarks Uses Google OAuth2.0 for social login
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const oauthConfig = new OAuthConfigService(configService);
    const config = oauthConfig.getGoogleConfig();

    super({
      clientID: config.clientID,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      scope: config.scope,
    });
  }

  /**
   * Validates Google OAuth response and extracts user data
   * @param accessToken - Google access token
   * @param refreshToken - Google refresh token
   * @param profile - Google user profile
   * @param done - Passport callback
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const user = {
      provider: 'google',
      providerId: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
    };

    done(null, user);
  }
}
