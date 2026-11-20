/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { EnvValidationError, parseEnv } from './env';

const valid = {
  DATABASE_URL: 'postgresql://seven:x@127.0.0.1:5434/seven_suite',
  DATABASE_APP_URL: 'postgresql://seven_app:x@127.0.0.1:5434/seven_suite',
  REDIS_URL: 'redis://127.0.0.1:6380',
  JWT_SECRET: 'x'.repeat(48),
  WEB_SERVICE_KEY: 'y'.repeat(32),
};

describe('parseEnv', () => {
  it('accepts a complete environment and applies defaults', () => {
    const env = parseEnv(valid);
    expect(env.API_PORT).toBe(4000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.LOG_LEVEL).toBe('info');
  });

  it('coerces numbers', () => {
    expect(parseEnv({ ...valid, API_PORT: '5000' }).API_PORT).toBe(5000);
  });

  it('reports every problem at once', () => {
    try {
      parseEnv({ ...valid, DATABASE_URL: undefined, JWT_SECRET: 'short' });
      fail('expected EnvValidationError');
    } catch (e) {
      expect(e).toBeInstanceOf(EnvValidationError);
      const issues = (e as EnvValidationError).issues.join('\n');
      expect(issues).toContain('DATABASE_URL');
      expect(issues).toContain('JWT_SECRET must be at least 48 characters');
    }
  });
});
