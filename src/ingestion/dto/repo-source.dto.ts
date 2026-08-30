export enum RepoSourceType {
  Local = 'local',
  Git = 'git',
}

/**
 * Wire-level shape for describing where to ingest a repo from. Union fields
 * (path/url/ref) are validated and narrowed into a RepoSource by toRepoSource().
 */
export class RepoSourceDto {
  type: RepoSourceType;
  path?: string;
  url?: string;
  ref?: string;
  /** Bypass the cached result (if any) and force a fresh analysis run. */
  noCache?: boolean;
}
