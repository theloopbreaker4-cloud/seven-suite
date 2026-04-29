/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: auth.controller.ts
 * Description: Authentication controller - exposes login and register endpoints
 * Created: 2025-10-26
 */

import { Controller, Post, Body, UseGuards, Request, Get, Res, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TwoFactorService } from '../services/two-factor.service';
import { UserService } from '../services/user.service';
import { RecaptchaService } from './recaptcha.service';
import { OAuthConfigService } from '../config/oauth.config';

/**
 * AuthController - handles authentication HTTP requests
 * @remarks Provides login and registration endpoints
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
    private readonly userService: UserService,
    private readonly recaptchaService: RecaptchaService,
    private readonly oauthConfigService: OAuthConfigService,
  ) {}

  /**
   * Login endpoint - validates credentials and returns JWT token
   * @param req - Request object containing validated user from LocalAuthGuard
   * @param body - Request body containing recaptchaToken
   * @returns Object with access_token
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Body() body: { recaptchaToken?: string }) {
    // Verify reCAPTCHA if enabled and token provided
    if (this.recaptchaService.isEnabled() && body.recaptchaToken) {
      const isValid = await this.recaptchaService.verifyToken(body.recaptchaToken, 'login');
      if (!isValid) {
        throw new BadRequestException('reCAPTCHA verification failed');
      }
    }

    return this.authService.login(req.user);
  }

  /**
   * Register endpoint - creates new user account
   * @param body - Registration data (email, password, firstName, lastName, recaptchaToken)
   * @returns Created user information
   */
  @Post('register')
  async register(
    @Body()
    body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      recaptchaToken?: string;
    },
  ) {
    // Verify reCAPTCHA if enabled and token provided
    if (this.recaptchaService.isEnabled() && body.recaptchaToken) {
      const isValid = await this.recaptchaService.verifyToken(body.recaptchaToken, 'register');
      if (!isValid) {
        throw new BadRequestException('reCAPTCHA verification failed');
      }
    }

    return this.authService.register(body);
  }

  /**
   * Initiate password reset — always returns 200 (no enumeration leak).
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: { email: string }) {
    if (!body?.email) throw new BadRequestException('Email is required');
    const result = await this.authService.forgotPassword(body.email);
    return { message: 'If an account exists, a reset link has been sent', ...result };
  }

  /**
   * Complete password reset with token + new password.
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body?.token, body?.password);
  }

  // ==================== Google OAuth ====================
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Request() req, @Res() res: Response) {
    const result = await this.authService.validateOAuthUser(req.user);
    const callbackUrl = this.oauthConfigService.getFrontendCallbackURL();
    res.redirect(`${callbackUrl}?token=${result.access_token}`);
  }

  // ==================== Facebook OAuth ====================
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth() {
    // Redirects to Facebook
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthCallback(@Request() req, @Res() res: Response) {
    const result = await this.authService.validateOAuthUser(req.user);
    const callbackUrl = this.oauthConfigService.getFrontendCallbackURL();
    res.redirect(`${callbackUrl}?token=${result.access_token}`);
  }

  // ==================== GitHub OAuth ====================
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Request() req, @Res() res: Response) {
    const result = await this.authService.validateOAuthUser(req.user);
    const callbackUrl = this.oauthConfigService.getFrontendCallbackURL();
    res.redirect(`${callbackUrl}?token=${result.access_token}`);
  }

  // ==================== Discord OAuth ====================
  @Get('discord')
  @UseGuards(AuthGuard('discord'))
  async discordAuth() {
    // Redirects to Discord
  }

  @Get('discord/callback')
  @UseGuards(AuthGuard('discord'))
  async discordAuthCallback(@Request() req, @Res() res: Response) {
    const result = await this.authService.validateOAuthUser(req.user);
    const callbackUrl = this.oauthConfigService.getFrontendCallbackURL();
    res.redirect(`${callbackUrl}?token=${result.access_token}`);
  }

  // ==================== Telegram OAuth ====================
  @Get('telegram')
  @UseGuards(AuthGuard('telegram'))
  async telegramAuth() {
    // Redirects to Telegram
  }

  @Get('telegram/callback')
  @UseGuards(AuthGuard('telegram'))
  async telegramAuthCallback(@Request() req, @Res() res: Response) {
    const result = await this.authService.validateOAuthUser(req.user);
    const callbackUrl = this.oauthConfigService.getFrontendCallbackURL();
    res.redirect(`${callbackUrl}?token=${result.access_token}`);
  }

  // ==================== 2FA Endpoints ====================

  /**
   * Enable 2FA - Generate secret and QR code
   * @param req - Request object with authenticated user
   * @returns Object with QR code and secret
   */
  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  async enable2FA(@Request() req) {
    const user = await this.userService.findByEmail(req.user.email);

    if (!user) {
      throw new Error('User not found');
    }

    // Generate new 2FA secret
    const { secret, otpauthUrl } = this.twoFactorService.generateSecret(user.email);

    // Generate QR code
    const qrCode = await this.twoFactorService.generateQRCode(otpauthUrl);

    // Save secret to user (but don't enable 2FA yet - wait for verification)
    user.twoFactorSecret = secret;
    await user.save();

    return {
      qrCode,
      secret, // Send secret as backup for manual entry
    };
  }

  /**
   * Verify and activate 2FA
   * @param req - Request object with authenticated user
   * @param body - Contains the verification token
   * @returns Success message
   */
  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verify2FA(@Request() req, @Body() body: { token: string }) {
    const user = await this.userService.findByEmail(req.user.email);

    if (!user || !user.twoFactorSecret) {
      throw new Error('2FA not initialized');
    }

    // Verify the token
    const isValid = this.twoFactorService.verifyToken(
      body.token,
      user.twoFactorSecret,
    );

    if (!isValid) {
      throw new Error('Invalid 2FA token');
    }

    // Enable 2FA for user
    user.twoFactorEnabled = true;
    await user.save();

    return {
      message: '2FA enabled successfully',
      backupCodes: this.twoFactorService.generateBackupCodes(),
    };
  }

  /**
   * Disable 2FA
   * @param req - Request object with authenticated user
   * @param body - Contains the verification token
   * @returns Success message
   */
  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disable2FA(@Request() req, @Body() body: { token: string }) {
    const user = await this.userService.findByEmail(req.user.email);

    if (!user || !user.twoFactorEnabled) {
      throw new Error('2FA not enabled');
    }

    // Verify the token before disabling
    const isValid = this.twoFactorService.verifyToken(
      body.token,
      user.twoFactorSecret as string,
    );

    if (!isValid) {
      throw new Error('Invalid 2FA token');
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    return {
      message: '2FA disabled successfully',
    };
  }

  /**
   * Verify 2FA token during login
   * @param body - Contains email and 2FA token
   * @returns JWT access token if valid
   */
  @Post('2fa/authenticate')
  @HttpCode(HttpStatus.OK)
  async authenticate2FA(
    @Body() body: { email: string; token: string; tempToken?: string },
  ) {
    const user = await this.userService.findByEmail(body.email);

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new Error('2FA not enabled for this user');
    }

    // Verify the 2FA token
    const isValid = this.twoFactorService.verifyToken(
      body.token,
      user.twoFactorSecret,
    );

    if (!isValid) {
      throw new Error('Invalid 2FA token');
    }

    // Return full JWT token
    return this.authService.login(user);
  }
}
