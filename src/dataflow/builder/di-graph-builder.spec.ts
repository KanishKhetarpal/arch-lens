import { join } from 'node:path';
import { ImportExportExtractor } from '../../parser/extraction/import-export-extractor';
import { NestDeclarationExtractor } from '../../parser/extraction/nest-declaration-extractor';
import { ModuleSymbol } from '../../parser/interfaces/module-symbol.interface';
import { ModuleSymbolNormalizer } from '../../parser/normalization/module-symbol-normalizer';
import { TsMorphProjectLoader } from '../../parser/project/ts-morph-project-loader';
import { DiGraphBuilder } from './di-graph-builder';

describe('DiGraphBuilder', () => {
  const fixtureRoot = join(__dirname, '..', '__fixtures__', 'layered-project');
  let builder: DiGraphBuilder;

  const relativePaths = [
    'cats.controller.ts',
    'cats.service.ts',
    'cats.repository.ts',
    'cats.module.ts',
    'interfaces/cat.interface.ts',
    'dto/create-cat.dto.ts',
  ];

  const buildSymbols = (): ModuleSymbol[] => {
    const normalizer = new ModuleSymbolNormalizer(
      new TsMorphProjectLoader(),
      new ImportExportExtractor(),
      new NestDeclarationExtractor(),
    );
    const files = relativePaths.map((relativePath) => ({
      absolutePath: join(fixtureRoot, relativePath),
      relativePath,
      extension: '.ts',
    }));
    return normalizer.normalize(files);
  };

  beforeEach(() => {
    builder = new DiGraphBuilder();
  });

  it('creates one node per DI-participating class, skipping the @Module wiring class', () => {
    const graph = builder.build(buildSymbols());

    expect(graph.nodes.map((node) => node.id).sort()).toEqual([
      'cats.controller.ts#CatsController',
      'cats.repository.ts#CatsRepository',
      'cats.service.ts#CatsService',
    ]);
  });

  it('assigns controller/service/repository layers', () => {
    const graph = builder.build(buildSymbols());
    const layerOf = (id: string) => graph.nodes.find((node) => node.id === id)?.layer;

    expect(layerOf('cats.controller.ts#CatsController')).toBe('controller');
    expect(layerOf('cats.service.ts#CatsService')).toBe('service');
    expect(layerOf('cats.repository.ts#CatsRepository')).toBe('repository');
  });

  it('builds an injection edge for each constructor parameter that resolves to another node', () => {
    const graph = builder.build(buildSymbols());

    expect(graph.edges).toEqual([
      {
        from: 'cats.controller.ts#CatsController',
        to: 'cats.service.ts#CatsService',
        paramName: 'catsService',
        token: undefined,
      },
      {
        from: 'cats.service.ts#CatsService',
        to: 'cats.repository.ts#CatsRepository',
        paramName: 'catsRepository',
        token: undefined,
      },
    ]);
  });

  it('captures the @Inject(...) token when a parameter uses one', () => {
    const symbols: ModuleSymbol[] = [
      {
        relativePath: 'a.ts',
        imports: [],
        exports: [],
        functions: [],
        classes: [
          {
            name: 'A',
            isExported: true,
            isDefaultExport: false,
            decorators: [{ name: 'Injectable', arguments: [] }],
            constructorParams: [
              {
                name: 'conn',
                typeName: 'Connection',
                decorators: [{ name: 'Inject', arguments: ["'DB_CONNECTION'"] }],
              },
            ],
            methodNames: [],
          },
          {
            name: 'Connection',
            isExported: true,
            isDefaultExport: false,
            decorators: [{ name: 'Injectable', arguments: [] }],
            constructorParams: [],
            methodNames: [],
          },
        ],
      },
    ];

    const graph = builder.build(symbols);

    expect(graph.edges).toEqual([
      { from: 'a.ts#A', to: 'a.ts#Connection', paramName: 'conn', token: "'DB_CONNECTION'" },
    ]);
  });

  it('strips generic/array suffixes before matching a type name', () => {
    const symbols: ModuleSymbol[] = [
      {
        relativePath: 'a.ts',
        imports: [],
        exports: [],
        functions: [],
        classes: [
          {
            name: 'Repo',
            isExported: true,
            isDefaultExport: false,
            decorators: [{ name: 'Injectable', arguments: [] }],
            constructorParams: [],
            methodNames: [],
          },
          {
            name: 'Consumer',
            isExported: true,
            isDefaultExport: false,
            decorators: [{ name: 'Injectable', arguments: [] }],
            constructorParams: [{ name: 'repo', typeName: 'Repo<Cat>', decorators: [] }],
            methodNames: [],
          },
        ],
      },
    ];

    const graph = builder.build(symbols);

    expect(graph.edges).toEqual([
      { from: 'a.ts#Consumer', to: 'a.ts#Repo', paramName: 'repo', token: undefined },
    ]);
  });

  it('does not create an edge for a parameter type that never resolves to a known class', () => {
    const symbols: ModuleSymbol[] = [
      {
        relativePath: 'a.ts',
        imports: [],
        exports: [],
        functions: [],
        classes: [
          {
            name: 'A',
            isExported: true,
            isDefaultExport: false,
            decorators: [{ name: 'Injectable', arguments: [] }],
            constructorParams: [{ name: 'x', typeName: 'string', decorators: [] }],
            methodNames: [],
          },
        ],
      },
    ];

    expect(builder.build(symbols).edges).toEqual([]);
  });
});
