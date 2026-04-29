# Backend Project Structure Guide

**Project:** Seven
**Author:** TheLoopBreaker (prgera)
**Created:** 2025-11-06

## Table of Contents
- [Core Architecture Folders](#core-architecture-folders)
- [Third-Party Libraries Integration](#third-party-libraries-integration)
- [Best Practices](#best-practices)

---

## Core Architecture Folders

### 📁 `decorators/` - Custom Decorators
**Purpose:** Reusable metadata annotations for classes, methods, and parameters

**Common Use Cases:**
- **Route Decorators:** Custom route metadata
- **Validation Decorators:** Custom validators
- **Authorization Decorators:** Role-based access control
- **Transformation Decorators:** Data transformation

**Examples to Implement:**

```typescript
// decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// Usage: @Roles('admin', 'moderator')
```

```typescript
// decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Usage: getCurrentUser(@CurrentUser() user: User)
```

```typescript
// decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Usage: @Public() - to skip JWT authentication
```

```typescript
// decorators/throttle.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const THROTTLE_KEY = 'throttle';
export const Throttle = (limit: number, ttl: number) =>
  SetMetadata(THROTTLE_KEY, { limit, ttl });

// Usage: @Throttle(10, 60) - 10 requests per 60 seconds
```

---

### 📁 `guards/` - Route Guards
**Purpose:** Protect routes based on conditions (authentication, authorization, etc.)

**Current Implementation:**
- `auth/guards/local-auth.guard.ts` - Username/password authentication
- `auth/guards/jwt-auth.guard.ts` - JWT token verification

**Examples to Implement:**

```typescript
// guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Usage:
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('admin')
// async deleteUser() {}
```

```typescript
// guards/throttle.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { THROTTLE_KEY } from '../decorators/throttle.decorator';

@Injectable()
export class ThrottleGuard implements CanActivate {
  private requests = new Map<string, number[]>();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const throttle = this.reflector.get(THROTTLE_KEY, context.getHandler());
    if (!throttle) return true;

    const request = context.switchToHttp().getRequest();
    const key = `${request.ip}-${request.url}`;

    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const recentRequests = requests.filter(time => now - time < throttle.ttl * 1000);

    if (recentRequests.length >= throttle.limit) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    return true;
  }
}
```

```typescript
// guards/ownership.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class OwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id;

    // Check if user owns the resource
    // Implementation depends on your business logic

    if (!this.isOwner(user, resourceId)) {
      throw new ForbiddenException('You do not own this resource');
    }

    return true;
  }

  private isOwner(user: any, resourceId: string): boolean {
    // Your ownership logic here
    return true;
  }
}
```

---

### 📁 `types/` - TypeScript Type Definitions
**Purpose:** Shared interfaces, types, and enums

**Examples to Implement:**

```typescript
// types/user.types.ts
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
  PENDING = 'pending',
}

export interface JwtPayload {
  sub: string;
  email: string;
  roles: UserRole[];
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: 'Bearer';
}
```

```typescript
// types/pagination.types.ts
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
```

```typescript
// types/api.types.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

```typescript
// types/email.types.ts
export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
}

export enum EmailTemplate {
  WELCOME = 'welcome',
  VERIFICATION = 'verification',
  PASSWORD_RESET = 'password-reset',
  NOTIFICATION = 'notification',
}
```

---

### 📁 `utils/` - Utility Functions
**Purpose:** Reusable helper functions and utilities

**Examples to Implement:**

```typescript
// utils/password.util.ts
import * as bcrypt from 'bcrypt';

export class PasswordUtil {
  private static readonly SALT_ROUNDS = 10;

  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
```

```typescript
// utils/date.util.ts
export class DateUtil {
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  static isExpired(date: Date): boolean {
    return new Date() > date;
  }

  static formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day);
  }

  static getTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }
}
```

```typescript
// utils/string.util.ts
export class StringUtil {
  static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static truncate(text: string, length: number, suffix: string = '...'): string {
    if (text.length <= length) return text;
    return text.substring(0, length - suffix.length) + suffix;
  }

  static generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  static camelToSnake(text: string): string {
    return text.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  static snakeToCamel(text: string): string {
    return text.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }
}
```

```typescript
// utils/validation.util.ts
export class ValidationUtil {
  static isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  static isUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static sanitizeInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}
```

```typescript
// utils/pagination.util.ts
import { PaginationOptions, PaginatedResponse } from '../types/pagination.types';

export class PaginationUtil {
  static paginate<T>(
    data: T[],
    total: number,
    options: PaginationOptions,
  ): PaginatedResponse<T> {
    const { page, limit } = options;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  static getSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}
```

---

### 📁 `pipes/` - Custom Pipes
**Purpose:** Transform or validate input data

**Current Implementation:**
- `pipes/uppercase.pipe.ts` - Transform string to uppercase

**Examples to Implement:**

```typescript
// pipes/parse-objectid.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform {
  transform(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid ObjectId format');
    }
    return new Types.ObjectId(value);
  }
}

// Usage: findById(@Param('id', ParseObjectIdPipe) id: Types.ObjectId)
```

```typescript
// pipes/validation.pipe.ts
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors.map(err => Object.values(err.constraints || {})).flat();
      throw new BadRequestException(messages);
    }

    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

---

### 📁 `interceptors/` - Request/Response Interceptors
**Purpose:** Intercept requests/responses for logging, transformation, caching

**Current Implementation:**
- `interceptors/logging.interceptor.ts` - Request/response logging

**Examples to Implement:**

```typescript
// interceptors/transform.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../types/api.types';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}

// Usage: @UseInterceptors(TransformInterceptor)
```

```typescript
// interceptors/cache.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, any>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const key = `${request.method}:${request.url}`;

    if (this.cache.has(key)) {
      return of(this.cache.get(key));
    }

    return next.handle().pipe(
      tap(response => {
        this.cache.set(key, response);
        // Clear cache after 5 minutes
        setTimeout(() => this.cache.delete(key), 5 * 60 * 1000);
      }),
    );
  }
}
```

---

### 📁 `middlewares/` - Middleware Functions
**Purpose:** Process requests before they reach route handlers

**Current Implementation:**
- `middlewares/redirect.middleware.ts` - URL redirect handling
- `middlewares/context.middleware.ts` - Request context management

**Examples to Implement:**

```typescript
// middlewares/request-id.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    req['requestId'] = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  }
}
```

```typescript
// middlewares/rate-limit.middleware.ts
import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private requests = new Map<string, number[]>();

  use(req: Request, res: Response, next: NextFunction) {
    const key = req.ip;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100;

    const requests = this.requests.get(key) || [];
    const recentRequests = requests.filter(time => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    next();
  }
}
```

---

## Third-Party Libraries Integration

### Where to Place Third-Party Library Integrations

#### 📁 `modules/` - Feature Modules
**For:** Complete feature integrations (Mail, Queue, Payment, File Upload, etc.)

**Example Structure:**
```
backend/src/app/
├── modules/
│   ├── mail/
│   │   ├── mail.module.ts
│   │   ├── mail.service.ts
│   │   ├── mail.controller.ts  (optional)
│   │   ├── templates/
│   │   │   ├── welcome.hbs
│   │   │   ├── verification.hbs
│   │   │   └── password-reset.hbs
│   │   └── dto/
│   │       └── send-email.dto.ts
│   │
│   ├── queue/
│   │   ├── queue.module.ts
│   │   ├── queue.service.ts
│   │   ├── processors/
│   │   │   ├── email.processor.ts
│   │   │   └── notification.processor.ts
│   │   └── jobs/
│   │       └── email.job.ts
│   │
│   ├── payment/
│   │   ├── payment.module.ts
│   │   ├── payment.service.ts
│   │   ├── payment.controller.ts
│   │   ├── strategies/
│   │   │   ├── stripe.strategy.ts
│   │   │   └── paypal.strategy.ts
│   │   └── webhooks/
│   │       └── stripe-webhook.controller.ts
│   │
│   ├── storage/
│   │   ├── storage.module.ts
│   │   ├── storage.service.ts
│   │   ├── storage.controller.ts
│   │   └── providers/
│   │       ├── s3.provider.ts
│   │       └── local.provider.ts
│   │
│   └── notification/
│       ├── notification.module.ts
│       ├── notification.service.ts
│       ├── channels/
│       │   ├── email.channel.ts
│       │   ├── sms.channel.ts
│       │   └── push.channel.ts
│       └── dto/
│           └── send-notification.dto.ts
```

---

### Common Third-Party Libraries to Integrate

#### 1. **Nodemailer** - Email Sending

**Installation:**
```bash
npm install @nestjs-modules/mailer nodemailer
npm install --save-dev @types/nodemailer
npm install handlebars  # For email templates
```

**Integration Location:** `modules/mail/`

**Example:**
```typescript
// modules/mail/mail.module.ts
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { MailService } from './mail.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          port: config.get('MAIL_PORT'),
          secure: false,
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"${config.get('APP_NAME')}" <${config.get('MAIL_FROM')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
```

```typescript
// modules/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailOptions } from '../../types/email.types';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Seven!',
      template: 'welcome',
      context: {
        name,
      },
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify Your Email',
      template: 'verification',
      context: {
        url,
      },
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: {
        url,
      },
    });
  }
}
```

---

#### 2. **Bull Queue** - Job Queue Processing

**Installation:**
```bash
npm install @nestjs/bull bull
npm install --save-dev @types/bull
```

**Integration Location:** `modules/queue/`

**Example:**
```typescript
// modules/queue/queue.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailProcessor } from './processors/email.processor';
import { QueueService } from './queue.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  providers: [QueueService, EmailProcessor],
  exports: [QueueService],
})
export class QueueModule {}
```

---

#### 3. **Stripe** - Payment Processing

**Installation:**
```bash
npm install stripe
npm install --save-dev @types/stripe
```

**Integration Location:** `modules/payment/`

---

#### 4. **AWS SDK** - S3 File Storage

**Installation:**
```bash
npm install @aws-sdk/client-s3
npm install @aws-sdk/s3-request-presigner
```

**Integration Location:** `modules/storage/`

---

#### 5. **Firebase Admin** - Push Notifications

**Installation:**
```bash
npm install firebase-admin
```

**Integration Location:** `modules/notification/`

---

## Best Practices

### 1. **Naming Conventions**
- Decorators: `*.decorator.ts`
- Guards: `*.guard.ts`
- Pipes: `*.pipe.ts`
- Interceptors: `*.interceptor.ts`
- Middleware: `*.middleware.ts`
- Utils: `*.util.ts`
- Types: `*.types.ts`

### 2. **File Organization**
- Keep related functionality together
- Use index files for easy imports
- Group by feature, not by type

### 3. **Module Organization**
```
module-name/
├── module-name.module.ts
├── module-name.service.ts
├── module-name.controller.ts
├── dto/
│   ├── create-module.dto.ts
│   └── update-module.dto.ts
├── entities/
│   └── module.entity.ts
├── interfaces/
│   └── module.interface.ts
└── tests/
    └── module-name.service.spec.ts
```

### 4. **Import Paths**
Use path aliases in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@app/*": ["src/app/*"],
      "@config/*": ["src/app/config/*"],
      "@utils/*": ["src/app/utils/*"],
      "@types/*": ["src/app/types/*"]
    }
  }
}
```

---

**Last Updated:** 2025-11-06
**Author:** TheLoopBreaker
**Project:** Seven
