import { Injectable, LoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const LOG_DIR  = path.resolve(process.cwd(), 'logs');
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

@Injectable()
export class AppLoggerService implements LoggerService {
  constructor() {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  }

  private dateStamp(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private timestamp(): string {
    return new Date().toISOString();
  }

  private currentLogPath(): string {
    const base = path.join(LOG_DIR, `${this.dateStamp()}.log`);
    if (!fs.existsSync(base)) return base;

    const stat = fs.statSync(base);
    if (stat.size < MAX_SIZE) return base;

    let n = 1;
    let rotated: string;
    do {
      rotated = path.join(LOG_DIR, `${this.dateStamp()}_${n}.log`);
      n++;
    } while (fs.existsSync(rotated) && fs.statSync(rotated).size >= MAX_SIZE);

    return rotated;
  }

  private write(level: string, message: string, context?: string): void {
    const line = JSON.stringify({
      time: this.timestamp(),
      level,
      msg: message,
      ...(context ? { context } : {}),
    });

    if (level === 'error' || level === 'warn') {
      process.stderr.write(line + '\n');
    } else {
      process.stdout.write(line + '\n');
    }

    try {
      fs.appendFileSync(this.currentLogPath(), line + '\n', 'utf8');
    } catch (e) {
      process.stderr.write(`[logger] write failed: ${(e as Error).message}\n`);
    }
  }

  log(message: string, context?: string)   { this.write('info',  message, context); }
  error(message: string, trace?: string, context?: string) { this.write('error', `${message}${trace ? ' | ' + trace : ''}`, context); }
  warn(message: string, context?: string)  { this.write('warn',  message, context); }
  debug(message: string, context?: string) { this.write('debug', message, context); }
  verbose(message: string, context?: string) { this.write('verbose', message, context); }
}
