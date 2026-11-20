/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Global, Module } from '@nestjs/common';
import { Env, parseEnv } from './env';

/** Injection token for the validated environment. */
export const ENV = Symbol('ENV');

/**
 * Provides the parsed, typed environment. Validation runs once when the module is
 * created, so a misconfigured process fails at boot.
 */
@Global()
@Module({
  providers: [{ provide: ENV, useFactory: (): Env => parseEnv(process.env) }],
  exports: [ENV],
})
export class PlatformConfigModule {}
