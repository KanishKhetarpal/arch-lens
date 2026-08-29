import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AnalysisJobService } from '../jobs/analysis-job.service';
import { AnalysisJob, JobStatus } from '../jobs/interfaces/analysis-job.interface';
import { RepoSourceDto } from '../ingestion/dto/repo-source.dto';
import { toRepoSource } from '../ingestion/models/repo-source.model';

type DiagramFormat = 'mermaid' | 'html' | 'json';
const DIAGRAM_FORMATS: DiagramFormat[] = ['mermaid', 'html', 'json'];

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

  @Get('diagram/:id')
  diagram(
    @Param('id') id: string,
    @Query('format') format: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): string | object {
    const job = this.completedJob(id);
    const resolvedFormat = this.parseFormat(format);

    switch (resolvedFormat) {
      case 'mermaid':
        res.type('text/plain');
        return job.result!.mermaid;
      case 'html':
        res.type('text/html');
        return job.result!.html;
      case 'json':
        res.type('application/json');
        return job.result!.d3Json;
    }
  }

  @Get('explanation/:id')
  explanation(@Param('id') id: string) {
    return this.completedJob(id).result!.explanation;
  }

  private parseSource(body: RepoSourceDto) {
    try {
      return toRepoSource(body);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  private parseFormat(format: string | undefined): DiagramFormat {
    const resolved = format ?? 'mermaid';
    if (!DIAGRAM_FORMATS.includes(resolved as DiagramFormat)) {
      throw new BadRequestException(
        `Unsupported diagram format "${resolved}". Expected one of: ${DIAGRAM_FORMATS.join(', ')}`,
      );
    }
    return resolved as DiagramFormat;
  }

  private completedJob(id: string): AnalysisJob {
    const job = this.jobs.get(id);
    if (job.status !== JobStatus.Completed) {
      throw new ConflictException(
        `Analysis job "${id}" is not completed yet (status: ${job.status})`,
      );
    }
    return job;
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
