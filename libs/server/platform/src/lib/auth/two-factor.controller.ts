/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ZodPipe } from '../validation/zod.pipe';
import {
  twoFactorCodeSchema,
  twoFactorDisableSchema,
  type TwoFactorCodeInput,
  type TwoFactorDisableInput,
} from './auth.schemas';
import { CurrentAuth, DemoLocked, UserOnly } from './decorators';
import type { AuthContext } from './tokens';
import { TwoFactorService } from './two-factor.service';

/**
 * The signed-in user's own two-factor settings. Locked on the public demo (a shared account must
 * not be lockable) and unreachable with an API key (only a person can change how they sign in).
 */
@UserOnly()
@Controller('auth/2fa')
export class TwoFactorController {
  constructor(private readonly twoFactor: TwoFactorService) {}

  @Get()
  status(@CurrentAuth() auth: AuthContext) {
    return this.twoFactor.status(auth.userId);
  }

  @DemoLocked()
  @Post('setup')
  @HttpCode(200)
  setup(@CurrentAuth() auth: AuthContext) {
    return this.twoFactor.setup(auth.userId);
  }

  @DemoLocked()
  @Post('enable')
  @HttpCode(200)
  enable(
    @CurrentAuth() auth: AuthContext,
    @Body(new ZodPipe(twoFactorCodeSchema)) body: TwoFactorCodeInput,
  ) {
    return this.twoFactor.enable(auth.userId, body.code);
  }

  @DemoLocked()
  @Post('disable')
  @HttpCode(204)
  async disable(
    @CurrentAuth() auth: AuthContext,
    @Body(new ZodPipe(twoFactorDisableSchema)) body: TwoFactorDisableInput,
  ): Promise<void> {
    await this.twoFactor.disable(auth.userId, body.password, body.code);
  }

  @DemoLocked()
  @Post('recovery-codes')
  @HttpCode(200)
  regenerate(
    @CurrentAuth() auth: AuthContext,
    @Body(new ZodPipe(twoFactorCodeSchema)) body: TwoFactorCodeInput,
  ) {
    return this.twoFactor.regenerateRecoveryCodes(auth.userId, body.code);
  }
}
