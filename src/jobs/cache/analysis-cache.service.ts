import { Injectable } from '@nestjs/common';
import { resolve } from 'node:path';
import { AnalysisResult } from '../../analysis/interfaces/analysis-result.interface';
import { AppConfigService } from '../../config/app-config.service';
import { RepoSourceType } from '../../ingestion/dto/repo-source.dto';
import { RepoSource } from '../../ingestion/models/repo-source.model';

interface CacheEntry {
  result: AnalysisResult;
  expiresAt: number;
}

/**
 * In-memory cache of analysis results keyed by repo source, so repeated
 * requests for the same local path or git url+ref within the TTL skip the
 * ingest/parse/graph/dataflow/diagram/explain pipeline entirely.
 */
@Injectable()
export class AnalysisCacheService {
  private readonly entries = new Map<string, CacheEntry>();

  constructor(private readonly appConfig: AppConfigService) {}

  get(source: RepoSource): AnalysisResult | undefined {
    const key = this.keyFor(source);
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.result;
  }

  set(source: RepoSource, result: AnalysisResult): void {
    const ttlMs = this.appConfig.analysisCacheTtlSeconds * 1000;
    if (ttlMs <= 0) {
      return;
    }
    this.entries.set(this.keyFor(source), { result, expiresAt: Date.now() + ttlMs });
  }

  clear(): void {
    this.entries.clear();
  }

  private keyFor(source: RepoSource): string {
    switch (source.type) {
      case RepoSourceType.Local:
        return `local:${resolve(source.path)}`;
      case RepoSourceType.Git:
        return `git:${source.url}@${source.ref ?? 'HEAD'}`;
    }
  }
}
