/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { DomainError } from '../errors/domain-error';
import { RedisService } from '../redis/redis.service';

const WINDOW_SECONDS = 15 * 60;
/** Failed logins allowed per (IP, email) and per IP within the window. */
const PER_ACCOUNT = 5;
const PER_IP = 30;

/**
 * Brute-force protection for credential endpoints, in Redis so it holds across API instances.
 * Counts failures only; a successful login clears the per-account counter.
 */
@Injectable()
export class LoginLimiter {
  constructor(private readonly redis: RedisService) {}

  private keys(ip: string, email: string) {
    const e = createHash('sha256')
      .update(email.toLowerCase())
      .digest('hex')
      .slice(0, 32);
    return { account: `rl:login:acct:${ip}:${e}`, ip: `rl:login:ip:${ip}` };
  }

  async assertAllowed(ip: string, email: string): Promise<void> {
    const k = this.keys(ip, email);
    const [acct, perIp] = await this.redis.client.mget(k.account, k.ip);
    if (Number(acct ?? 0) >= PER_ACCOUNT || Number(perIp ?? 0) >= PER_IP) {
      throw DomainError.tooManyRequests();
    }
  }

  async recordFailure(ip: string, email: string): Promise<void> {
    const k = this.keys(ip, email);
    await this.redis.client
      .multi()
      .incr(k.account)
      .expire(k.account, WINDOW_SECONDS, 'NX')
      .incr(k.ip)
      .expire(k.ip, WINDOW_SECONDS, 'NX')
      .exec();
  }

  async recordSuccess(ip: string, email: string): Promise<void> {
    await this.redis.client.del(this.keys(ip, email).account);
  }
}
