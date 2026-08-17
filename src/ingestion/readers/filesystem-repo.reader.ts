import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { RepoSourceType } from '../dto/repo-source.dto';
import { RepoReader, ResolvedRepo } from '../interfaces/repo-reader.interface';
import { RepoSource } from '../models/repo-source.model';

@Injectable()
export class FilesystemRepoReader implements RepoReader {
  async resolve(source: RepoSource): Promise<ResolvedRepo> {
    if (source.type !== RepoSourceType.Local) {
      throw new Error(`FilesystemRepoReader cannot resolve a source of type "${source.type}"`);
    }

    const rootPath = resolve(source.path);
    const stats = await fs.stat(rootPath).catch(() => null);
    if (!stats || !stats.isDirectory()) {
      throw new NotFoundException(`Repo path does not exist or is not a directory: ${rootPath}`);
    }

    return {
      rootPath,
      cleanup: async () => {
        // Nothing to release: the caller owns this path on local disk.
      },
    };
  }
}
