/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: recaptcha.service.ts
 * Description: Service for verifying Google reCAPTCHA v3 tokens
 * Created: 2025-11-02
 */

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface RecaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  score?: number;
  action?: string;
  'error-codes'?: string[];
}

@Injectable()
export class RecaptchaService {
  private readonly logger = new Logger(RecaptchaService.name);
  private readonly secretKey: string;
  private readonly verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
  private readonly minScore = 0.5; // Minimum score for v3 (0.0 - 1.0, higher is better)

  constructor(private readonly httpService: HttpService) {
    this.secretKey = process.env.RECAPTCHA_SECRET_KEY || '';

    if (!this.secretKey) {
      this.logger.warn('RECAPTCHA_SECRET_KEY not configured. reCAPTCHA verification will be skipped.');
    }
  }

  /**
   * Verify reCAPTCHA token with Google
   * @param token - The reCAPTCHA token from the client
   * @param expectedAction - Optional action to verify (for v3)
   * @returns Promise<boolean> - Whether the token is valid
   */
  async verifyToken(token: string, expectedAction?: string): Promise<boolean> {
    // Skip verification if secret key is not configured (development mode)
    if (!this.secretKey) {
      this.logger.warn('Skipping reCAPTCHA verification (no secret key configured)');
      return true;
    }

    if (!token) {
      this.logger.warn('No reCAPTCHA token provided');
      return false;
    }

    try {
      const params = new URLSearchParams({
        secret: this.secretKey,
        response: token,
      });

      const response = await firstValueFrom(
        this.httpService.post<RecaptchaResponse>(this.verifyUrl, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );

      const data = response.data;

      // Log verification result
      this.logger.log(`reCAPTCHA verification: success=${data.success}, score=${data.score}, action=${data.action}`);

      // Check if verification was successful
      if (!data.success) {
        this.logger.warn(`reCAPTCHA verification failed: ${data['error-codes']?.join(', ')}`);
        return false;
      }

      // For v3, check the score
      if (data.score !== undefined && data.score < this.minScore) {
        this.logger.warn(`reCAPTCHA score too low: ${data.score} < ${this.minScore}`);
        return false;
      }

      // Optionally verify the action
      if (expectedAction && data.action !== expectedAction) {
        this.logger.warn(`reCAPTCHA action mismatch: expected=${expectedAction}, got=${data.action}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error verifying reCAPTCHA:', error.message);
      // In case of error, fail securely (reject the request)
      return false;
    }
  }

  /**
   * Check if reCAPTCHA is configured and enabled
   */
  isEnabled(): boolean {
    return !!this.secretKey;
  }
}
