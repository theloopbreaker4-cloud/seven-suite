/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: facebook.strategy.ts
 * Description: Facebook OAuth2 authentication strategy
 * Created: 2025-11-01
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { OAuthConfigService } from '../../config/oauth.config';

/**
 * FacebookStrategy - implements Facebook OAuth2 authentication
 * @remarks Uses Facebook OAuth2.0 for social login
 */
@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private configService: ConfigService) {
    const oauthConfig = new OAuthConfigService(configService);
    const config = oauthConfig.getFacebookConfig();

    super({
      clientID: config.clientID,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      scope: config.scope,
      profileFields: ['id', 'displayName', 'name', 'emails', 'photos'],
    });
  }

  /**
   * Validates Facebook OAuth response and extracts user data
   * @param accessToken - Facebook access token
   * @param refreshToken - Facebook refresh token
   * @param profile - Facebook user profile
   * @param done - Passport callback
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const user = {
      provider: 'facebook',
      providerId: id,
      email: emails && emails.length > 0 ? emails[0].value : null,
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      picture: photos && photos.length > 0 ? photos[0].value : null,
      accessToken,
    };

    done(null, user);
  }
}
