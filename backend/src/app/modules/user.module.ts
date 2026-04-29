/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: user.module.ts
 * Description: User module - configures user-related controllers, services and schemas
 * Created: 2025-10-26
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from '../controllers/users.controller';
import { UserService } from '../services/user.service';
import { UserModel, UserSchema } from '../schemas/user.schema';

/**
 * UserModule - manages user functionality
 * @remarks Registers User schema with Mongoose and exports UserService for auth
 */
@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])],
  controllers: [UsersController],
  providers: [UserService, UserModel],
  exports: [UserService], // Export UserService for use in AuthModule
})
export class UserModule {}
