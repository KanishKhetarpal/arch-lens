import { Injectable } from '@nestjs/common';
import { Project, SourceFile as TsMorphSourceFile } from 'ts-morph';
import { SourceFile } from '../../ingestion/interfaces/source-file.interface';

@Injectable()
export class TsMorphProjectLoader {
  /**
   * Builds an in-memory ts-morph Project containing exactly the given files.
   * Dependency resolution is skipped so parsing stays fast and deterministic
   * regardless of the target repo's own tsconfig or node_modules.
   */
  load(files: SourceFile[]): Project {
    const project = new Project({
      useInMemoryFileSystem: false,
      skipFileDependencyResolution: true,
      skipAddingFilesFromTsConfig: true,
      compilerOptions: {
        allowJs: true,
      },
    });

    for (const file of files) {
      project.addSourceFileAtPath(file.absolutePath);
    }

    return project;
  }

  loadFile(file: SourceFile): TsMorphSourceFile {
    return this.load([file]).getSourceFileOrThrow(file.absolutePath);
  }
}
