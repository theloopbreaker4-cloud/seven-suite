/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: two-factor.service.ts
 * Description: Two-Factor Authentication service using TOTP
 * Created: 2025-11-02
 */

import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

/**
 * TwoFactorService - manages 2FA operations
 * @remarks Provides TOTP secret generation, QR code creation, and token verification
 */
@Injectable()
export class TwoFactorService {
  /**
   * Generate a new 2FA secret for a user
   * @param userEmail - User's email address
   * @param appName - Application name (default: 'Seven')
   * @returns Object containing secret and otpauth URL
   */
  generateSecret(userEmail: string, appName: string = 'Seven'): {
    secret: string;
    otpauthUrl: string;
  } {
    const secret = speakeasy.generateSecret({
      name: `${appName} (${userEmail})`,
      issuer: appName,
      length: 32,
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url as string,
    };
  }

  /**
   * Generate QR code as Data URL for 2FA setup
   * @param otpauthUrl - OTPAuth URL from secret generation
   * @returns Promise with QR code Data URL
   */
  async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify a TOTP token
   * @param token - 6-digit TOTP token from authenticator app
   * @param secret - User's 2FA secret
   * @param window - Time window for token validity (default: 1)
   * @returns Boolean indicating if token is valid
   */
  verifyToken(token: string, secret: string, window: number = 1): boolean {
    try {
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window, // Allow 1 time step before and after for clock skew
      });

      return verified;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a backup codes for 2FA recovery
   * @param count - Number of backup codes to generate (default: 10)
   * @returns Array of backup codes
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}
