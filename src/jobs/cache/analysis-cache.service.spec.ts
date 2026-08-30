import { AnalysisResult } from '../../analysis/interfaces/analysis-result.interface';
import { AppConfigService } from '../../config/app-config.service';
import { RepoSourceType } from '../../ingestion/dto/repo-source.dto';
import { AnalysisCacheService } from './analysis-cache.service';

function fakeAppConfig(ttlSeconds: number): AppConfigService {
  return { analysisCacheTtlSeconds: ttlSeconds } as unknown as AppConfigService;
}

const fakeResult = { mermaid: 'graph TD' } as unknown as AnalysisResult;

describe('AnalysisCacheService', () => {
  it('returns undefined for a source that was never cached', () => {
    const cache = new AnalysisCacheService(fakeAppConfig(300));
    expect(cache.get({ type: RepoSourceType.Local, path: '/repo' })).toBeUndefined();
  });

  it('returns a cached result for the same local path', () => {
    const cache = new AnalysisCacheService(fakeAppConfig(300));
    const source = { type: RepoSourceType.Local, path: '/repo' } as const;

    cache.set(source, fakeResult);

    expect(cache.get(source)).toBe(fakeResult);
    expect(cache.get({ type: RepoSourceType.Local, path: '/repo' })).toBe(fakeResult);
  });

  it('treats different git refs of the same url as distinct cache entries', () => {
    const cache = new AnalysisCacheService(fakeAppConfig(300));
    const main = {
      type: RepoSourceType.Git,
      url: 'https://example.com/repo.git',
      ref: 'main',
    } as const;
    const dev = {
      type: RepoSourceType.Git,
      url: 'https://example.com/repo.git',
      ref: 'dev',
    } as const;

    cache.set(main, fakeResult);

    expect(cache.get(main)).toBe(fakeResult);
    expect(cache.get(dev)).toBeUndefined();
  });

  it('does not cache anything when the TTL is zero', () => {
    const cache = new AnalysisCacheService(fakeAppConfig(0));
    const source = { type: RepoSourceType.Local, path: '/repo' } as const;

    cache.set(source, fakeResult);

    expect(cache.get(source)).toBeUndefined();
  });

  it('expires entries once the TTL elapses', () => {
    jest.useFakeTimers();
    try {
      const cache = new AnalysisCacheService(fakeAppConfig(60));
      const source = { type: RepoSourceType.Local, path: '/repo' } as const;

      cache.set(source, fakeResult);
      jest.advanceTimersByTime(61_000);

      expect(cache.get(source)).toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });

  it('clear() removes all entries', () => {
    const cache = new AnalysisCacheService(fakeAppConfig(300));
    const source = { type: RepoSourceType.Local, path: '/repo' } as const;

    cache.set(source, fakeResult);
    cache.clear();

    expect(cache.get(source)).toBeUndefined();
  });
});
