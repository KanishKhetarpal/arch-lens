import { Module } from '@nestjs/common';
import { ImportExportExtractor } from './extraction/import-export-extractor';
import { TsMorphProjectLoader } from './project/ts-morph-project-loader';

@Module({
  providers: [TsMorphProjectLoader, ImportExportExtractor],
  exports: [TsMorphProjectLoader, ImportExportExtractor],
})
export class ParserModule {}
