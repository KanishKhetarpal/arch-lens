import { AnalysisResult } from '../../analysis/interfaces/analysis-result.interface';
import { RepoSource } from '../../ingestion/models/repo-source.model';

export enum JobStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

export interface AnalysisJob {
  id: string;
  status: JobStatus;
  source: RepoSource;
  createdAt: Date;
  completedAt?: Date;
  result?: AnalysisResult;
  error?: string;
  fromCache?: boolean;
}
