import { Module } from '@nestjs/common';
import { ApiModule } from './api/api.module';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [ConfigModule, HealthModule, ApiModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
