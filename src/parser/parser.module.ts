import { Module } from '@nestjs/common';
import { ImportExportExtractor } from './extraction/import-export-extractor';
import { NestDeclarationExtractor } from './extraction/nest-declaration-extractor';
import { ModuleSymbolNormalizer } from './normalization/module-symbol-normalizer';
import { TsMorphProjectLoader } from './project/ts-morph-project-loader';

@Module({
  providers: [
    TsMorphProjectLoader,
    ImportExportExtractor,
    NestDeclarationExtractor,
    ModuleSymbolNormalizer,
  ],
  exports: [
    TsMorphProjectLoader,
    ImportExportExtractor,
    NestDeclarationExtractor,
    ModuleSymbolNormalizer,
  ],
})
export class ParserModule {}
