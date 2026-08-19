import { Module } from '@nestjs/common';
import { ImportExportExtractor } from './extraction/import-export-extractor';
import { NestDeclarationExtractor } from './extraction/nest-declaration-extractor';
import { TsMorphProjectLoader } from './project/ts-morph-project-loader';

@Module({
  providers: [TsMorphProjectLoader, ImportExportExtractor, NestDeclarationExtractor],
  exports: [TsMorphProjectLoader, ImportExportExtractor, NestDeclarationExtractor],
})
export class ParserModule {}
