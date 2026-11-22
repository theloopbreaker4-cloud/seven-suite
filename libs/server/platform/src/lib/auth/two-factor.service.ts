/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Inject, Injectable } from '@nestjs/common';
import { recordAudit } from '../audit/audit';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import { PrismaService } from '../db/prisma.service';
import { DomainError } from '../errors/domain-error';
import { verifyPassword } from './password';
import { TokenService } from './tokens';
import {
  generateRecoveryCodes,
  generateTotpSecret,
  normalizeRecoveryCode,
  otpauthUrl,
  SecretBox,
  verifyTotp,
} from './totp';

/**
 * Two-factor sign-in with an authenticator app (TOTP) and single-use recovery codes.
 * The secret is encrypted at rest; codes can't be replayed; turning 2FA off needs the password
 * and a current code. All of it is account-level (owner connection, org_id NULL in the audit).
 */
@Injectable()
export class TwoFactorService {
  private readonly box: SecretBox;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) env: Env,
  ) {
    this.box = new SecretBox(env.JWT_SECRET, 'seven-suite/totp/v1');
  }

  async status(userId: string) {
    const user = await this.prisma.system.user.findUniqueOrThrow({
      where: { id: userId },
      select: { totpEnabledAt: true },
    });
    const left = await this.prisma.system.recoveryCode.count({ where: { userId, usedAt: null } });
    return { enabled: !!user.totpEnabledAt, enabledAt: user.totpEnabledAt, recoveryCodesLeft: left };
  }

  /** Step 1: a fresh secret to scan. Not active until confirmed with a code. */
  async setup(userId: string) {
    const user = await this.prisma.system.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.totpEnabledAt)
      throw DomainError.conflict('2fa_already_enabled', 'Two-factor sign-in is already on');
    const secret = generateTotpSecret();
    await this.prisma.system.user.update({
      where: { id: userId },
      data: { totpSecret: this.box.seal(secret), totpLastStep: null },
    });
    return { secret, otpauthUrl: otpauthUrl(secret, user.email) };
  }

  /** Step 2: prove the app works; returns the recovery codes — shown once, never again. */
  async enable(userId: string, code: string) {
    const user = await this.prisma.system.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.totpEnabledAt)
      throw DomainError.conflict('2fa_already_enabled', 'Two-factor sign-in is already on');
    if (!user.totpSecret)
      throw DomainError.validation({ code: 'Start the setup first' });
    const step = verifyTotp(this.box.open(user.totpSecret), code, null);
    if (step === null) throw DomainError.validation({ code: 'Wrong code' });

    const codes = generateRecoveryCodes();
    await this.prisma.system.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { totpEnabledAt: new Date(), totpLastStep: BigInt(step) },
      });
      await tx.recoveryCode.deleteMany({ where: { userId } });
      await tx.recoveryCode.createMany({
        data: codes.map((c) => ({ userId, codeHash: TokenService.hash(c) })),
      });
      await recordAudit(tx, { orgId: null, actorId: userId, entityType: 'user', entityId: userId, action: '2fa_enabled' });
    });
    return { recoveryCodes: codes };
  }

  async disable(userId: string, password: string, code: string): Promise<void> {
    const user = await this.prisma.system.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.totpEnabledAt) return;
    if (!(await verifyPassword(password, user.passwordHash)))
      throw DomainError.validation({ password: 'Wrong password' });
    if (!(await this.verify(userId, code)))
      throw DomainError.validation({ code: 'Wrong code' });
    await this.prisma.system.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { totpSecret: null, totpEnabledAt: null, totpLastStep: null },
      });
      await tx.recoveryCode.deleteMany({ where: { userId } });
      await recordAudit(tx, { orgId: null, actorId: userId, entityType: 'user', entityId: userId, action: '2fa_disabled' });
    });
  }

  /** A new set of recovery codes (the old ones stop working). Needs a current app code. */
  async regenerateRecoveryCodes(userId: string, code: string) {
    const user = await this.prisma.system.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.totpEnabledAt || !user.totpSecret)
      throw DomainError.conflict('2fa_not_enabled', 'Two-factor sign-in is off');
    if (!(await this.verifyTotpOnly(userId, user.totpSecret, user.totpLastStep, code)))
      throw DomainError.validation({ code: 'Wrong code' });
    const codes = generateRecoveryCodes();
    await this.prisma.system.$transaction(async (tx) => {
      await tx.recoveryCode.deleteMany({ where: { userId } });
      await tx.recoveryCode.createMany({ data: codes.map((c) => ({ userId, codeHash: TokenService.hash(c) })) });
      await recordAudit(tx, { orgId: null, actorId: userId, entityType: 'user', entityId: userId, action: '2fa_recovery_regenerated' });
    });
    return { recoveryCodes: codes };
  }

  /**
   * The second factor at sign-in: an app code or a recovery code. Each is consumed atomically —
   * two parallel requests with the same code can't both pass.
   */
  async verify(userId: string, code: string): Promise<'totp' | 'recovery' | null> {
    const user = await this.prisma.system.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true, totpEnabledAt: true, totpLastStep: true },
    });
    if (!user?.totpEnabledAt || !user.totpSecret) return null;
    const trimmed = code.replace(/\s/g, '');
    if (/^\d{6}$/.test(trimmed))
      return (await this.verifyTotpOnly(userId, user.totpSecret, user.totpLastStep, trimmed)) ? 'totp' : null;

    const used = await this.prisma.system.recoveryCode.updateMany({
      where: { userId, codeHash: TokenService.hash(normalizeRecoveryCode(trimmed)), usedAt: null },
      data: { usedAt: new Date() },
    });
    return used.count === 1 ? 'recovery' : null;
  }

  private async verifyTotpOnly(userId: string, sealed: string, lastStep: bigint | null, code: string): Promise<boolean> {
    const step = verifyTotp(this.box.open(sealed), code, lastStep === null ? null : Number(lastStep));
    if (step === null) return false;
    // Compare-and-set: only one request can advance past this step.
    const claimed = await this.prisma.system.user.updateMany({
      where: {
        id: userId,
        OR: [{ totpLastStep: null }, { totpLastStep: { lt: BigInt(step) } }],
      },
      data: { totpLastStep: BigInt(step) },
    });
    return claimed.count === 1;
  }
}
