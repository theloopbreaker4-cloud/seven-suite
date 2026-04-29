/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: users.controller.ts
 * Description: Users controller - handles user-related HTTP endpoints
 * Created: 2025-10-26
 */

import {
  Controller,
  UseInterceptors,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { User } from '../models/user.model';

/**
 * UsersController - manages user API endpoints
 * @remarks GET /users (admin), GET/PUT/DELETE /users/:id
 */
@Controller('users')
@UseInterceptors(LoggingInterceptor)
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string): Promise<User> {
    return this.userService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<User>): Promise<User> {
    return this.userService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<{ deleted: boolean }> {
    return this.userService.delete(id);
  }
}
