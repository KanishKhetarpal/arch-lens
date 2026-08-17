import { Module } from '@nestjs/common';
import { SourceFileEnumerator } from './enumeration/source-file-enumerator';
import { FilesystemRepoReader } from './readers/filesystem-repo.reader';
import { GitRepoReader } from './readers/git-repo.reader';

@Module({
  providers: [FilesystemRepoReader, GitRepoReader, SourceFileEnumerator],
  exports: [FilesystemRepoReader, GitRepoReader, SourceFileEnumerator],
})
export class IngestionModule {}
