import { Module } from '@nestjs/common';
import { FilesystemRepoReader } from './readers/filesystem-repo.reader';

@Module({
  providers: [FilesystemRepoReader],
  exports: [FilesystemRepoReader],
})
export class IngestionModule {}
