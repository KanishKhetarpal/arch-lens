import { join } from 'node:path';
import { ImportExportExtractor } from '../../parser/extraction/import-export-extractor';
import { NestDeclarationExtractor } from '../../parser/extraction/nest-declaration-extractor';
import { ModuleSymbolNormalizer } from '../../parser/normalization/module-symbol-normalizer';
import { TsMorphProjectLoader } from '../../parser/project/ts-morph-project-loader';
import { DependencyGraphBuilder } from './dependency-graph-builder';

describe('DependencyGraphBuilder', () => {
  const fixtureRoot = join(__dirname, '..', '..', 'parser', '__fixtures__', 'sample-project');
  let builder: DependencyGraphBuilder;
  let normalizer: ModuleSymbolNormalizer;

  const relativePaths = [
    'cats.controller.ts',
    'cats.service.ts',
    'cats.module.ts',
    'index.ts',
    'interfaces/cat.interface.ts',
    'dto/create-cat.dto.ts',
    'utils/describe-cat.ts',
    'utils/logger.ts',
    'utils/math.ts',
  ];
  const files = relativePaths.map((relativePath) => ({
    absolutePath: join(fixtureRoot, relativePath),
    relativePath,
    extension: '.ts',
  }));

  beforeEach(() => {
    builder = new DependencyGraphBuilder();
    normalizer = new ModuleSymbolNormalizer(
      new TsMorphProjectLoader(),
      new ImportExportExtractor(),
      new NestDeclarationExtractor(),
    );
  });

  it('creates one node per module, with external imports captured separately', () => {
    const graph = builder.build(normalizer.normalize(files));

    expect(graph.nodes).toHaveLength(files.length);
    const controller = graph.nodes.find((n) => n.id === 'cats.controller.ts');
    expect(controller?.externalImports).toEqual(['@nestjs/common']);
  });

  it('builds edges from relative imports resolved against the known file set', () => {
    const graph = builder.build(normalizer.normalize(files));

    expect(graph.edges).toHaveLength(8);
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        { from: 'cats.controller.ts', to: 'cats.service.ts', specifier: './cats.service' },
        {
          from: 'cats.controller.ts',
          to: 'dto/create-cat.dto.ts',
          specifier: './dto/create-cat.dto',
        },
        {
          from: 'cats.service.ts',
          to: 'interfaces/cat.interface.ts',
          specifier: './interfaces/cat.interface',
        },
        { from: 'cats.module.ts', to: 'cats.controller.ts', specifier: './cats.controller' },
        { from: 'cats.module.ts', to: 'cats.service.ts', specifier: './cats.service' },
        { from: 'utils/describe-cat.ts', to: 'utils/logger.ts', specifier: './logger' },
        { from: 'utils/describe-cat.ts', to: 'utils/math.ts', specifier: './math' },
        {
          from: 'utils/describe-cat.ts',
          to: 'interfaces/cat.interface.ts',
          specifier: '../interfaces/cat.interface',
        },
      ]),
    );
  });

  it('does not create edges for re-exports (export ... from), only imports', () => {
    const graph = builder.build(normalizer.normalize(files));

    expect(graph.edges.some((e) => e.from === 'index.ts')).toBe(false);
  });

  it('omits edges for specifiers that fall outside the parsed file set', () => {
    const partial = files.filter((f) => f.relativePath !== 'cats.service.ts');
    const graph = builder.build(normalizer.normalize(partial));

    expect(graph.edges.some((e) => e.to === 'cats.service.ts')).toBe(false);
  });
});
