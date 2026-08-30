import { AnalysisService } from '../analysis/analysis.service';
import { AnalysisResult } from '../analysis/interfaces/analysis-result.interface';
import { RepoSourceType } from '../ingestion/dto/repo-source.dto';
import { RepoSource } from '../ingestion/models/repo-source.model';
import { AnalysisJobService } from './analysis-job.service';
import { AnalysisCacheService } from './cache/analysis-cache.service';
import { JobStatus } from './interfaces/analysis-job.interface';

const source: RepoSource = { type: RepoSourceType.Local, path: '/repo' };
const result = { mermaid: 'graph TD' } as unknown as AnalysisResult;

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('AnalysisJobService', () => {
  let analysisService: jest.Mocked<AnalysisService>;
  let cache: AnalysisCacheService;
  let jobs: AnalysisJobService;

  beforeEach(() => {
    analysisService = {
      analyze: jest.fn().mockResolvedValue(result),
    } as unknown as jest.Mocked<AnalysisService>;
    cache = new AnalysisCacheService({ analysisCacheTtlSeconds: 300 } as never);
    jobs = new AnalysisJobService(analysisService, cache);
  });

  it('runs analysis and completes the job on a cache miss', async () => {
    const job = jobs.create(source);
    expect(job.status).not.toBe(JobStatus.Completed);

    await flushMicrotasks();

    const completed = jobs.get(job.id);
    expect(completed.status).toBe(JobStatus.Completed);
    expect(completed.result).toBe(result);
    expect(completed.fromCache).toBeUndefined();
    expect(analysisService.analyze).toHaveBeenCalledTimes(1);
  });

  it('serves a cached result synchronously and skips the pipeline', async () => {
    const first = jobs.create(source);
    await flushMicrotasks();
    expect(jobs.get(first.id).status).toBe(JobStatus.Completed);

    const second = jobs.create(source);

    expect(second.status).toBe(JobStatus.Completed);
    expect(second.fromCache).toBe(true);
    expect(second.result).toBe(result);
    expect(analysisService.analyze).toHaveBeenCalledTimes(1);
  });

  it('bypasses the cache when skipCache is set', async () => {
    const first = jobs.create(source);
    await flushMicrotasks();
    expect(jobs.get(first.id).status).toBe(JobStatus.Completed);

    const second = jobs.create(source, { skipCache: true });
    expect(second.status).not.toBe(JobStatus.Completed);

    await flushMicrotasks();

    expect(analysisService.analyze).toHaveBeenCalledTimes(2);
  });

  it('marks the job failed and does not cache when analysis throws', async () => {
    analysisService.analyze.mockRejectedValueOnce(new Error('boom'));

    const job = jobs.create(source);
    await flushMicrotasks();

    const failed = jobs.get(job.id);
    expect(failed.status).toBe(JobStatus.Failed);
    expect(failed.error).toBe('boom');
    expect(cache.get(source)).toBeUndefined();
  });

  it('throws NotFoundException for an unknown job id', () => {
    expect(() => jobs.get('missing')).toThrow('No analysis job found with id "missing"');
  });
});
