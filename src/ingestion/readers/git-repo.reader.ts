import { Injectable } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import simpleGit from 'simple-git';
import { RepoSourceType } from '../dto/repo-source.dto';
import { RepoReader, ResolvedRepo } from '../interfaces/repo-reader.interface';
import { RepoSource } from '../models/repo-source.model';

@Injectable()
export class GitRepoReader implements RepoReader {
  async resolve(source: RepoSource): Promise<ResolvedRepo> {
    if (source.type !== RepoSourceType.Git) {
      throw new Error(`GitRepoReader cannot resolve a source of type "${source.type}"`);
    }

    const rootPath = await fs.mkdtemp(join(tmpdir(), 'arch-lens-'));

    const cloneArgs = ['--depth', '1'];
    if (source.ref) {
      cloneArgs.push('--branch', source.ref, '--single-branch');
    }

    try {
      await simpleGit().clone(source.url, rootPath, cloneArgs);
    } catch (error) {
      await fs.rm(rootPath, { recursive: true, force: true });
      throw error;
    }

    return {
      rootPath,
      cleanup: async () => {
        await fs.rm(rootPath, { recursive: true, force: true });
      },
    };
  }
}
