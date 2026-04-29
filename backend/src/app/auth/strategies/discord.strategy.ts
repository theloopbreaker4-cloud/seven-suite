/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: discord.strategy.ts
 * Description: Discord OAuth2 authentication strategy
 * Created: 2025-11-01
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-discord';
import { ConfigService } from '@nestjs/config';
import { OAuthConfigService } from '../../config/oauth.config';

/**
 * DiscordStrategy - implements Discord OAuth2 authentication
 * @remarks Uses Discord OAuth2.0 for social login
 */
@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(private configService: ConfigService) {
    const oauthConfig = new OAuthConfigService(configService);
    const config = oauthConfig.getDiscordConfig();

    super({
      clientID: config.clientID,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      scope: config.scope,
    });
  }

  /**
   * Validates Discord OAuth response and extracts user data
   * @param accessToken - Discord access token
   * @param refreshToken - Discord refresh token
   * @param profile - Discord user profile
   * @param done - Passport callback
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { id, username, email, avatar } = profile;

    const user = {
      provider: 'discord',
      providerId: id,
      email: email || null,
      firstName: username || '',
      lastName: '',
      picture: avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png` : null,
      accessToken,
    };

    done(null, user);
  }
}
