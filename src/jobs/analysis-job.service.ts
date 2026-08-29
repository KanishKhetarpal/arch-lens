import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AnalysisService } from '../analysis/analysis.service';
import { RepoSource } from '../ingestion/models/repo-source.model';
import { AnalysisJob, JobStatus } from './interfaces/analysis-job.interface';

@Injectable()
export class AnalysisJobService {
  private readonly jobs = new Map<string, AnalysisJob>();

  constructor(private readonly analysisService: AnalysisService) {}

  /** Creates a job and starts analysis in the background; callers poll `get()` for progress. */
  create(source: RepoSource): AnalysisJob {
    const job: AnalysisJob = {
      id: randomUUID(),
      status: JobStatus.Pending,
      source,
      createdAt: new Date(),
    };
    this.jobs.set(job.id, job);

    void this.run(job);

    return job;
  }

  get(id: string): AnalysisJob {
    const job = this.jobs.get(id);
    if (!job) {
      throw new NotFoundException(`No analysis job found with id "${id}"`);
    }
    return job;
  }

  private async run(job: AnalysisJob): Promise<void> {
    job.status = JobStatus.Running;
    try {
      job.result = await this.analysisService.analyze(job.source);
      job.status = JobStatus.Completed;
    } catch (error) {
      job.status = JobStatus.Failed;
      job.error = error instanceof Error ? error.message : String(error);
    } finally {
      job.completedAt = new Date();
    }
  }
}
