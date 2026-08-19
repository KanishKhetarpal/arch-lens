import { Injectable } from '@nestjs/common';
import { SourceFile } from '../../ingestion/interfaces/source-file.interface';
import { ImportExportExtractor } from '../extraction/import-export-extractor';
import { NestDeclarationExtractor } from '../extraction/nest-declaration-extractor';
import { ModuleSymbol } from '../interfaces/module-symbol.interface';
import { TsMorphProjectLoader } from '../project/ts-morph-project-loader';

@Injectable()
export class ModuleSymbolNormalizer {
  constructor(
    private readonly projectLoader: TsMorphProjectLoader,
    private readonly importExportExtractor: ImportExportExtractor,
    private readonly declarationExtractor: NestDeclarationExtractor,
  ) {}

  normalize(files: SourceFile[]): ModuleSymbol[] {
    const project = this.projectLoader.load(files);

    return files.map((file) => {
      const sourceFile = project.getSourceFileOrThrow(file.absolutePath);

      return {
        relativePath: file.relativePath,
        imports: this.importExportExtractor.extractImports(sourceFile),
        exports: this.importExportExtractor.extractExports(sourceFile),
        classes: this.declarationExtractor.extractClasses(sourceFile),
        functions: this.declarationExtractor.extractFunctions(sourceFile),
      };
    });
  }
}
