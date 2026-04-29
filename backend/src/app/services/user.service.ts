/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: user.service.ts
 * Description: User service - manages user data operations and business logic
 * Created: 2025-10-26
 */

import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../models/user.model';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcrypt';

/**
 * UserService - handles user-related business logic
 * @remarks Contains methods for user CRUD operations with MongoDB and Redis caching
 */
@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Get all users (excluding passwords)
   * @returns Array of users without password field
   */
  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  /**
   * Find user by ID (with Redis caching)
   * @param id - User ID
   * @returns User document without password
   */
  async findById(id: string): Promise<User> {
    // Try to get from cache
    return this.redisService.getOrSet(
      `user:${id}`,
      async () => {
        const user = await this.userModel.findById(id).select('-password').exec();
        if (!user) {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user.toObject();
      },
      1800, // Cache for 30 minutes
    );
  }

  /**
   * Find user by email
   * @param email - User email
   * @returns User document (includes password for authentication)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  /**
   * Find user by userName
   * @param userName - Username
   * @returns User document or null
   */
  async findByUserName(userName: string): Promise<User | null> {
    return this.userModel.findOne({ userName: userName.toLowerCase() }).exec();
  }

  /**
   * Update last login timestamp
   * @param id - User ID
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { lastLoginAt: new Date() }).exec();
    await this.redisService.invalidateUser(id);
  }

  /**
   * Create new user
   * @param userData - User data including password
   * @returns Created user document without password
   */
  async create(userData: Partial<User>): Promise<User> {
    const existingEmail = await this.findByEmail(userData.email);
    if (existingEmail) {
      throw new ConflictException('User with this email already exists');
    }

    if (userData.userName) {
      const existingUserName = await this.findByUserName(userData.userName);
      if (existingUserName) {
        throw new ConflictException('User with this username already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = new this.userModel({
      ...userData,
      email: userData.email.toLowerCase(),
      userName: userData.userName?.toLowerCase(),
      password: hashedPassword,
    });

    const savedUser = await user.save();
    return this.findById(savedUser._id.toString());
  }

  /**
   * Update user by ID
   * @param id - User ID
   * @param updateData - Data to update
   * @returns Updated user document
   */
  async update(id: string, updateData: Partial<User>): Promise<User> {
    // If password is being updated, hash it
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Invalidate cache
    await this.redisService.invalidateUser(id);

    return user;
  }

  /**
   * Delete user by ID
   * @param id - User ID
   * @returns Deletion result
   */
  async delete(id: string): Promise<{ deleted: boolean }> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Invalidate cache
    await this.redisService.invalidateUser(id);

    return { deleted: true };
  }

  /**
   * Validate user password
   * @param user - User document
   * @param password - Plain text password
   * @returns true if password is valid
   */
  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  /**
   * Find user by OAuth provider and providerId
   * @param provider - OAuth provider name
   * @param providerId - Provider-specific user ID
   * @returns User document or null
   */
  async findByProviderId(provider: string, providerId: string): Promise<User | null> {
    return this.userModel.findOne({ provider, providerId }).exec();
  }

  /**
   * Create user from OAuth profile
   * @param oauthProfile - OAuth profile data
   * @returns Created user document
   */
  async createFromOAuth(oauthProfile: {
    provider: string;
    providerId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  }): Promise<User> {
    // Generate a unique userName from email prefix
    const baseUserName = oauthProfile.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
    let userName = baseUserName;
    let counter = 1;
    while (await this.findByUserName(userName)) {
      userName = `${baseUserName}${counter++}`;
    }

    const user = new this.userModel({
      email: oauthProfile.email.toLowerCase(),
      firstName: oauthProfile.firstName,
      lastName: oauthProfile.lastName,
      userName,
      provider: oauthProfile.provider,
      providerId: oauthProfile.providerId,
      avatar: oauthProfile.avatar,
      isActive: true,
    });

    return user.save();
  }
}
