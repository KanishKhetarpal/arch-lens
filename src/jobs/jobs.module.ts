import { Module } from '@nestjs/common';
import { AnalysisModule } from '../analysis/analysis.module';
import { AnalysisJobService } from './analysis-job.service';

@Module({
  imports: [AnalysisModule],
  providers: [AnalysisJobService],
  exports: [AnalysisJobService],
})
export class JobsModule {}
