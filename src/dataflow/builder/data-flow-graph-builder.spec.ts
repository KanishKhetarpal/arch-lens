import { join } from 'node:path';
import { DependencyGraphBuilder } from '../../graph/builder/dependency-graph-builder';
import { ImportExportExtractor } from '../../parser/extraction/import-export-extractor';
import { NestDeclarationExtractor } from '../../parser/extraction/nest-declaration-extractor';
import { ModuleSymbolNormalizer } from '../../parser/normalization/module-symbol-normalizer';
import { TsMorphProjectLoader } from '../../parser/project/ts-morph-project-loader';
import { DtoEdgeAnnotator } from '../annotation/dto-edge-annotator';
import { FlowTracer } from '../analysis/flow-tracer';
import { DataFlowGraphBuilder } from './data-flow-graph-builder';
import { DiGraphBuilder } from './di-graph-builder';

describe('DataFlowGraphBuilder', () => {
  const fixtureRoot = join(__dirname, '..', '__fixtures__', 'layered-project');

  const relativePaths = [
    'cats.controller.ts',
    'cats.service.ts',
    'cats.repository.ts',
    'cats.module.ts',
    'interfaces/cat.interface.ts',
    'dto/create-cat.dto.ts',
  ];

  const buildSymbols = () => {
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

  const buildBuilder = () =>
    new DataFlowGraphBuilder(new DiGraphBuilder(), new FlowTracer(), new DtoEdgeAnnotator());

  it('keeps the dependency graph nodes as-is', () => {
    const symbols = buildSymbols();
    const dependencyGraph = new DependencyGraphBuilder().build(symbols);

    const flowGraph = buildBuilder().build(symbols, dependencyGraph);

    expect(flowGraph.nodes).toBe(dependencyGraph.nodes);
  });

  it('carries the injection graph and traces controller -> service -> repository', () => {
    const symbols = buildSymbols();
    const dependencyGraph = new DependencyGraphBuilder().build(symbols);

    const flowGraph = buildBuilder().build(symbols, dependencyGraph);

    expect(flowGraph.injection.nodes.map((node) => node.id).sort()).toEqual([
      'cats.controller.ts#CatsController',
      'cats.repository.ts#CatsRepository',
      'cats.service.ts#CatsService',
    ]);
    expect(flowGraph.flows).toEqual([
      {
        path: [
          'cats.controller.ts#CatsController',
          'cats.service.ts#CatsService',
          'cats.repository.ts#CatsRepository',
        ],
        layers: ['controller', 'service', 'repository'],
        reachesRepository: true,
      },
    ]);
  });

  it('tags the structural edge into the dto module with its Dto type', () => {
    const symbols = buildSymbols();
    const dependencyGraph = new DependencyGraphBuilder().build(symbols);

    const flowGraph = buildBuilder().build(symbols, dependencyGraph);

    const dtoEdge = flowGraph.edges.find(
      (edge) => edge.from === 'cats.controller.ts' && edge.to === 'dto/create-cat.dto.ts',
    );
    expect(dtoEdge?.dataTypes).toEqual(['CreateCatDto']);
  });

  it('reports reachesRepository: false when the DI chain never leads to a repository', () => {
    const symbols = [
      {
        relativePath: 'a.ts',
        imports: [],
        exports: [],
        functions: [],
        classes: [
          {
            name: 'AController',
            isExported: true,
            isDefaultExport: false,
            decorators: [{ name: 'Controller', arguments: [] }],
            constructorParams: [],
            methodNames: [],
          },
        ],
      },
    ];
    const dependencyGraph = {
      nodes: [{ id: 'a.ts', label: 'a.ts', externalImports: [] }],
      edges: [],
    };

    const flowGraph = buildBuilder().build(symbols, dependencyGraph);

    expect(flowGraph.flows).toEqual([
      { path: ['a.ts#AController'], layers: ['controller'], reachesRepository: false },
    ]);
  });
});
