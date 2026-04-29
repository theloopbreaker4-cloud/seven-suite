import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import Strategy from 'passport-telegram-official';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramStrategy extends PassportStrategy(Strategy, 'telegram') {
  constructor(private configService: ConfigService) {
    super({
      botToken: configService.get<string>('TELEGRAM_BOT_TOKEN'),
    });
  }

  async validate(profile: any): Promise<any> {
    const { id, first_name, last_name, username, photo_url } = profile;

    return {
      provider: 'telegram',
      providerId: id.toString(),
      email: username ? `${username}@telegram.user` : `${id}@telegram.user`,
      firstName: first_name,
      lastName: last_name,
      displayName: username || `${first_name} ${last_name || ''}`.trim(),
      photoUrl: photo_url,
      username: username,
    };
  }
}
