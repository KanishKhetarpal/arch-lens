import { Injectable } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';
import { SourceFile } from '../interfaces/source-file.interface';
import {
  DEFAULT_EXTENSIONS,
  DEFAULT_IGNORED_DIRS,
  DEFAULT_IGNORED_FILES,
  isIgnoredFile,
} from './ignore-rules';

export interface EnumerateSourceFilesOptions {
  /** File extensions to include, including the leading dot. */
  extensions?: string[];
  /** Directory names to skip entirely, wherever they occur in the tree. */
  ignoreDirs?: string[];
  /** Glob-lite filename patterns to skip, e.g. "*.d.ts". */
  ignoreFiles?: string[];
}

@Injectable()
export class SourceFileEnumerator {
  async enumerate(
    rootPath: string,
    options: EnumerateSourceFilesOptions = {},
  ): Promise<SourceFile[]> {
    const extensions = options.extensions ?? DEFAULT_EXTENSIONS;
    const ignoreDirs = new Set(options.ignoreDirs ?? DEFAULT_IGNORED_DIRS);
    const ignoreFiles = options.ignoreFiles ?? DEFAULT_IGNORED_FILES;

    const results: SourceFile[] = [];
    await this.walk(rootPath, rootPath, { extensions, ignoreDirs, ignoreFiles }, results);
    return results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }

  private async walk(
    rootPath: string,
    dir: string,
    rules: { extensions: string[]; ignoreDirs: Set<string>; ignoreFiles: string[] },
    results: SourceFile[],
  ): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (rules.ignoreDirs.has(entry.name)) {
          continue;
        }
        await this.walk(rootPath, join(dir, entry.name), rules, results);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const extension = extname(entry.name);
      if (!rules.extensions.includes(extension) || isIgnoredFile(entry.name, rules.ignoreFiles)) {
        continue;
      }

      const absolutePath = join(dir, entry.name);
      results.push({
        absolutePath,
        relativePath: relative(rootPath, absolutePath).split(sep).join('/'),
        extension,
      });
    }
  }
}
