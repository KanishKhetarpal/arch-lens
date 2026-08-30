import { Module } from '@nestjs/common';
import { AnalysisModule } from '../analysis/analysis.module';
import { AnalysisJobService } from './analysis-job.service';
import { AnalysisCacheService } from './cache/analysis-cache.service';

@Module({
  imports: [AnalysisModule],
  providers: [AnalysisJobService, AnalysisCacheService],
  exports: [AnalysisJobService],
})
export class JobsModule {}
