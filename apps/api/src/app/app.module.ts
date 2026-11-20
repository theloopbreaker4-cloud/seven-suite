/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Module } from '@nestjs/common';
import { ServerPlatformModule } from '@seven/server-platform';

@Module({
  imports: [ServerPlatformModule],
})
export class AppModule {}
