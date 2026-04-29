/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: config.service.ts
 * Description: Service for accessing application configuration values from environment variables
 * Created: 2025-10-26
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service that provides typed access to application configuration
 */
@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {

  }

  /**
   * Gets the application port from environment variables
   * @returns The port number as a string
   */
  getPort(): string {
    return this.configService.get<string>('PORT');
  }

  /**
   * Constructs the global API prefix from API path and version
   * @returns The global prefix in format 'API_PATH/API_VERSION'
   */
  getGlobalPrefix(): string {
    return `${this.configService.get<string>('API_PATH')}/${this.configService.get<string>('API_VERSION')}`;
  }

  /**
   * Gets the API path with leading and trailing slashes
   * @returns The API path in format '/API_PATH/'
   */
  getApiPath(): string {
    return `/${this.configService.get<string>('API_PATH')}/`;
  }

  /**
   * Constructs the full database connection host URL
   * @returns The database host URL with database name appended
   */
  getDatabaseHost(): string {
    return `${this.configService.get<string>('DATABASE_HOST')}${this.configService.get<string>('DATABASE_NAME')}`;
  }

  /**
   * Gets the database name from environment variables
   * @returns The database name
   */
  getDatabaseName(): string {
    return this.configService.get<string>('DATABASE_NAME');
  }

  /**
   * Gets the backend URL from environment variables
   * @returns The backend URL
   */
  getBackendUrl(): string {
    return this.configService.get<string>('BACKEND_URL') || '';
  }

  /**
   * Gets the frontend URL from environment variables
   * @returns The frontend URL
   */
  getFrontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL') || '';
  }

}