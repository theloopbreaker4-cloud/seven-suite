/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import {
  EventBus,
  OutboxDispatcher,
  ServerPlatformModule,
} from '@seven/server-platform';

/**
 * Background process: moves committed outbox events to the queue and runs event consumers.
 * Modules register their consumers with `EventBus.subscribe()` in their own onModuleInit.
 */
@Module({
  imports: [ServerPlatformModule],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(
    private readonly dispatcher: OutboxDispatcher,
    private readonly bus: EventBus,
  ) {}

  onApplicationBootstrap(): void {
    this.bus.start(Number(process.env['WORKER_CONCURRENCY'] ?? 5));
    this.dispatcher.start(1_000);
  }
}
