import { join } from 'node:path';
import { ImportExportExtractor } from '../extraction/import-export-extractor';
import { NestDeclarationExtractor } from '../extraction/nest-declaration-extractor';
import { TsMorphProjectLoader } from '../project/ts-morph-project-loader';
import { ModuleSymbolNormalizer } from './module-symbol-normalizer';

describe('ModuleSymbolNormalizer', () => {
  const fixtureRoot = join(__dirname, '..', '__fixtures__', 'sample-project');
  let normalizer: ModuleSymbolNormalizer;

  beforeEach(() => {
    normalizer = new ModuleSymbolNormalizer(
      new TsMorphProjectLoader(),
      new ImportExportExtractor(),
      new NestDeclarationExtractor(),
    );
  });

  it('normalizes a set of files into ModuleSymbols keyed by relative path', () => {
    const symbols = normalizer.normalize([
      {
        absolutePath: join(fixtureRoot, 'cats.controller.ts'),
        relativePath: 'cats.controller.ts',
        extension: '.ts',
      },
      {
        absolutePath: join(fixtureRoot, 'cats.service.ts'),
        relativePath: 'cats.service.ts',
        extension: '.ts',
      },
    ]);

    expect(symbols).toHaveLength(2);

    const controller = symbols.find((s) => s.relativePath === 'cats.controller.ts');
    expect(controller?.classes.map((c) => c.name)).toEqual(['CatsController']);
    expect(controller?.imports.map((i) => i.moduleSpecifier)).toEqual(
      expect.arrayContaining(['@nestjs/common', './cats.service', './dto/create-cat.dto']),
    );

    const service = symbols.find((s) => s.relativePath === 'cats.service.ts');
    expect(service?.classes[0]).toMatchObject({
      name: 'CatsService',
      decorators: [{ name: 'Injectable', arguments: [] }],
    });
  });

  it('captures re-exports on a barrel file', () => {
    const [symbol] = normalizer.normalize([
      { absolutePath: join(fixtureRoot, 'index.ts'), relativePath: 'index.ts', extension: '.ts' },
    ]);

    expect(symbol.exports).toHaveLength(3);
    expect(symbol.exports.some((e) => e.isWildcard)).toBe(true);
    expect(symbol.classes).toEqual([]);
    expect(symbol.functions).toEqual([]);
  });
});
