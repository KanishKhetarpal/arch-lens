import { join } from 'node:path';
import { DependencyGraphBuilder } from '../../graph/builder/dependency-graph-builder';
import { ImportExportExtractor } from '../../parser/extraction/import-export-extractor';
import { NestDeclarationExtractor } from '../../parser/extraction/nest-declaration-extractor';
import { ModuleSymbolNormalizer } from '../../parser/normalization/module-symbol-normalizer';
import { TsMorphProjectLoader } from '../../parser/project/ts-morph-project-loader';
import { DtoEdgeAnnotator } from './dto-edge-annotator';

describe('DtoEdgeAnnotator', () => {
  const fixtureRoot = join(__dirname, '..', '__fixtures__', 'layered-project');
  let annotator: DtoEdgeAnnotator;

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

  beforeEach(() => {
    annotator = new DtoEdgeAnnotator();
  });

  it('tags the edge into the dto module with the imported Dto type name', () => {
    const symbols = buildSymbols();
    const graph = new DependencyGraphBuilder().build(symbols);

    const edges = annotator.annotate(graph, symbols);
    const controllerToDto = edges.find(
      (edge) => edge.from === 'cats.controller.ts' && edge.to === 'dto/create-cat.dto.ts',
    );

    expect(controllerToDto?.dataTypes).toEqual(['CreateCatDto']);
  });

  it('leaves non-Dto edges with an empty dataTypes list', () => {
    const symbols = buildSymbols();
    const graph = new DependencyGraphBuilder().build(symbols);

    const edges = annotator.annotate(graph, symbols);
    const controllerToService = edges.find(
      (edge) => edge.from === 'cats.controller.ts' && edge.to === 'cats.service.ts',
    );

    expect(controllerToService?.dataTypes).toEqual([]);
  });

  it('preserves every original edge field alongside dataTypes', () => {
    const symbols = buildSymbols();
    const graph = new DependencyGraphBuilder().build(symbols);

    const edges = annotator.annotate(graph, symbols);
    const controllerToService = edges.find(
      (edge) => edge.from === 'cats.controller.ts' && edge.to === 'cats.service.ts',
    );

    expect(controllerToService).toEqual({
      from: 'cats.controller.ts',
      to: 'cats.service.ts',
      specifier: './cats.service',
      dataTypes: [],
    });
  });
});
