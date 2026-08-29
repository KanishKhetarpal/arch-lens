import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { AnalyzeController } from './analyze.controller';

@Module({
  imports: [JobsModule],
  controllers: [AnalyzeController],
})
export class ApiModule {}
