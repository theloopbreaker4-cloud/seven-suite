/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Inject, Injectable } from '@nestjs/common';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import { PrismaService } from '../db/prisma.service';
import { DomainError } from '../errors/domain-error';
import { MailService } from '../mail/mail.service';
import { resetPasswordMail, verifyEmailMail } from '../mail/templates';
import { RateLimiter } from '../redis/rate-limiter';
import { hashPassword } from './password';
import { TokenService } from './tokens';

type Purpose = 'verify_email' | 'reset_password';
const TTL_MS: Record<Purpose, number> = {
  verify_email: 48 * 3600_000,
  reset_password: 3600_000,
};

/** Email verification and password reset, both via single-use emailed tokens. */
@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly mail: MailService,
    private readonly limiter: RateLimiter,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async sendVerification(userId: string): Promise<void> {
    const user = await this.prisma.system.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (user.emailVerified) return;
    await this.limiter.consume(`verify:${userId}`, 5, 3600);
    const token = await this.issue(userId, 'verify_email');
    await this.mail.send(
      verifyEmailMail(user.email, user.name, this.link('/verify-email', token)),
    );
  }

  async verifyEmail(token: string): Promise<void> {
    const row = await this.consume(token, 'verify_email');
    await this.prisma.system.user.update({
      where: { id: row.userId },
      data: { emailVerified: new Date() },
    });
  }

  /**
   * Always succeeds from the caller's point of view, whether or not the email exists, so it
   * can't be used to discover accounts. Rate-limited per IP and per address.
   */
  async forgotPassword(email: string, ip: string): Promise<void> {
    await this.limiter.consume(`forgot:ip:${ip}`, 10, 3600);
    await this.limiter.consume(`forgot:email:${email}`, 3, 3600);
    const user = await this.prisma.system.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return;
    const token = await this.issue(user.id, 'reset_password');
    await this.mail.send(
      resetPasswordMail(
        user.email,
        user.name,
        this.link('/reset-password', token),
      ),
    );
  }

  /** Set a new password and sign out every session of the account. */
  async resetPassword(
    token: string,
    password: string,
    ip: string,
  ): Promise<void> {
    await this.limiter.consume(`reset:ip:${ip}`, 20, 3600);
    const row = await this.consume(token, 'reset_password');
    const passwordHash = await hashPassword(password);
    await this.prisma.system.$transaction([
      this.prisma.system.user.update({
        where: { id: row.userId },
        // Proving control of the inbox also verifies the address.
        data: { passwordHash, emailVerified: new Date() },
      }),
      this.prisma.system.refreshToken.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.system.userToken.updateMany({
        where: { userId: row.userId, purpose: 'reset_password', usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  private async issue(userId: string, purpose: Purpose): Promise<string> {
    const { token, hash } = this.tokens.newRefreshToken();
    await this.prisma.system.userToken.create({
      data: {
        userId,
        purpose,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + TTL_MS[purpose]),
      },
    });
    return token;
  }

  /** Mark a token used exactly once (atomic), or fail with a single generic error. */
  private async consume(token: string, purpose: Purpose) {
    const hash = TokenService.hash(token);
    const claimed = await this.prisma.system.userToken.updateMany({
      where: {
        tokenHash: hash,
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) {
      throw new DomainError(
        'invalid_token',
        'This link is invalid or has expired',
        400,
      );
    }
    return this.prisma.system.userToken.findUniqueOrThrow({
      where: { tokenHash: hash },
    });
  }

  private link(path: string, token: string): string {
    return `${this.env.ADMIN_URL}${path}?token=${encodeURIComponent(token)}`;
  }
}
