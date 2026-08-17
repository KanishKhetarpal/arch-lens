import { Module } from '@nestjs/common';
import { FilesystemRepoReader } from './readers/filesystem-repo.reader';
import { GitRepoReader } from './readers/git-repo.reader';

@Module({
  providers: [FilesystemRepoReader, GitRepoReader],
  exports: [FilesystemRepoReader, GitRepoReader],
})
export class IngestionModule {}
