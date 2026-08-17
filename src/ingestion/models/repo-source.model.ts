import { RepoSourceDto, RepoSourceType } from '../dto/repo-source.dto';

export interface LocalRepoSource {
  type: RepoSourceType.Local;
  path: string;
}

export interface GitRepoSource {
  type: RepoSourceType.Git;
  url: string;
  ref?: string;
}

export type RepoSource = LocalRepoSource | GitRepoSource;

export function toRepoSource(dto: RepoSourceDto): RepoSource {
  switch (dto.type) {
    case RepoSourceType.Local:
      if (!dto.path) {
        throw new Error('RepoSourceDto of type "local" requires a "path"');
      }
      return { type: RepoSourceType.Local, path: dto.path };
    case RepoSourceType.Git:
      if (!dto.url) {
        throw new Error('RepoSourceDto of type "git" requires a "url"');
      }
      return { type: RepoSourceType.Git, url: dto.url, ref: dto.ref };
    default:
      throw new Error(`Unknown RepoSourceDto type: ${String(dto.type)}`);
  }
}
