import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AnalysisService } from '../analysis/analysis.service';
import { RepoSource } from '../ingestion/models/repo-source.model';
import { AnalysisCacheService } from './cache/analysis-cache.service';
import { AnalysisJob, JobStatus } from './interfaces/analysis-job.interface';

export interface CreateJobOptions {
  /** Skip the result cache and force a fresh run, even if a cached result exists. */
  skipCache?: boolean;
}

@Injectable()
export class AnalysisJobService {
  private readonly jobs = new Map<string, AnalysisJob>();

  constructor(
    private readonly analysisService: AnalysisService,
    private readonly cache: AnalysisCacheService,
  ) {}

  /**
   * Creates a job and starts analysis in the background; callers poll
   * `get()` for progress. If a non-expired cached result exists for this
   * source, the job resolves immediately as completed.
   */
  create(source: RepoSource, options: CreateJobOptions = {}): AnalysisJob {
    const cached = options.skipCache ? undefined : this.cache.get(source);
    if (cached) {
      const now = new Date();
      const job: AnalysisJob = {
        id: randomUUID(),
        status: JobStatus.Completed,
        source,
        createdAt: now,
        completedAt: now,
        result: cached,
        fromCache: true,
      };
      this.jobs.set(job.id, job);
      return job;
    }

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
      this.cache.set(job.source, job.result);
      job.status = JobStatus.Completed;
    } catch (error) {
      job.status = JobStatus.Failed;
      job.error = error instanceof Error ? error.message : String(error);
    } finally {
      job.completedAt = new Date();
    }
  }
}
