/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: auth.service.ts
 * Description: Authentication service - handles user validation, login and JWT token generation
 * Created: 2025-10-26
 */

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserService } from '../services/user.service';
import { PasswordResetToken } from '../schemas/password-reset.schema';

/**
 * AuthService - manages authentication logic
 * @remarks Provides methods for user validation, password comparison and JWT generation
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectModel('PasswordResetToken')
    private readonly resetTokenModel: Model<PasswordResetToken>,
  ) {}

  /**
   * Initiates password reset flow. Issues a single-use token valid for 30 minutes.
   * Response is always 200 to avoid leaking user existence.
   */
  async forgotPassword(email: string): Promise<{ token?: string }> {
    const user = await this.userService.findByEmail(email);
    if (!user) return {};

    const rawToken  = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.resetTokenModel.create({
      email: user.email.toLowerCase(),
      tokenHash,
      expiresAt,
    });

    // When an email service is wired up, send the token via email here.
    // For now, return the raw token so the frontend/dev tools can complete the reset.
    return { token: rawToken };
  }

  /**
   * Completes password reset. Validates token, updates password, marks token used.
   */
  async resetPassword(rawToken: string, newPassword: string): Promise<{ ok: true }> {
    if (!rawToken || !newPassword || newPassword.length < 6) {
      throw new BadRequestException('Invalid token or password');
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = await this.resetTokenModel.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
    }).exec();

    if (!record) throw new BadRequestException('Token is invalid or expired');

    const user = await this.userService.findByEmail(record.email);
    if (!user) throw new NotFoundException('User not found');

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    record.used = true;
    await record.save();

    return { ok: true };
  }

  /**
   * Validates user credentials
   * @param {string} email - User email
   * @param {string} password - User password (plain text)
   * @returns User object without password if valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      return null;
    }

    if (!user.isActive) {
      return null; // User is deactivated
    }

    const isPasswordValid = await this.userService.validatePassword(user, password);

    if (!isPasswordValid) {
      return null;
    }

    // Return user without password
    const { password: _, ...result } = user.toObject();
    return result;
  }

  /**
   * Generates JWT token for authenticated user
   * @param user - User object
   * @returns Object containing access token and user data
   */
  async login(user: any) {
    // Check if user has 2FA enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      // Return requires2FA flag without token
      return {
        requires2FA: true,
        user: {
          id: user._id || user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    }

    const payload = {
      email: user.email,
      sub: user._id || user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id || user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Registers a new user
   * @param registerDto - Registration data (email, password, firstName, lastName)
   * @returns Newly created user object with access token
   */
  async register(registerDto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const user = await this.userService.create(registerDto);

    // Generate JWT token for the newly registered user
    const payload = {
      email: user.email,
      sub: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Validates or creates OAuth user
   * @param oauthProfile - OAuth profile data from provider
   * @returns User object with JWT token
   */
  async validateOAuthUser(oauthProfile: {
    provider: string;
    providerId: string;
    email: string;
    firstName: string;
    lastName: string;
    picture?: string;
  }) {
    // Try to find user by provider and providerId
    let user = await this.userService.findByProviderId(
      oauthProfile.provider,
      oauthProfile.providerId,
    );

    if (!user) {
      // If not found, try to find by email
      user = await this.userService.findByEmail(oauthProfile.email);

      if (user) {
        // Update existing user with OAuth data
        user.provider = oauthProfile.provider as any;
        user.providerId = oauthProfile.providerId;
        user.avatar = oauthProfile.picture || user.avatar;
        await user.save();
      } else {
        // Create new user from OAuth profile
        user = await this.userService.createFromOAuth(oauthProfile);
      }
    }

    return this.login(user);
  }
}
