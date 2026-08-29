import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AnalysisJobService } from '../jobs/analysis-job.service';
import { AnalysisJob, JobStatus } from '../jobs/interfaces/analysis-job.interface';
import { RepoSourceDto } from '../ingestion/dto/repo-source.dto';
import { toRepoSource } from '../ingestion/models/repo-source.model';

interface JobStatusResponse {
  id: string;
  status: JobStatus;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

@Controller()
export class AnalyzeController {
  constructor(private readonly jobs: AnalysisJobService) {}

  @Post('analyze')
  create(@Body() body: RepoSourceDto): JobStatusResponse {
    const source = this.parseSource(body);
    const job = this.jobs.create(source);
    return this.toStatusResponse(job);
  }

  @Get('analyze/:id')
  status(@Param('id') id: string): JobStatusResponse {
    return this.toStatusResponse(this.jobs.get(id));
  }

  private parseSource(body: RepoSourceDto) {
    try {
      return toRepoSource(body);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  private toStatusResponse(job: AnalysisJob): JobStatusResponse {
    return {
      id: job.id,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      error: job.error,
    };
  }
}
