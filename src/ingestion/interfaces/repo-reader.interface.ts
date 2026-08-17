import { RepoSource } from '../models/repo-source.model';

export interface ResolvedRepo {
  /** Absolute path to the repo's working tree on local disk. */
  rootPath: string;
  /** Releases any resources the reader allocated (e.g. a temp clone). */
  cleanup(): Promise<void>;
}

export interface RepoReader {
  resolve(source: RepoSource): Promise<ResolvedRepo>;
}
