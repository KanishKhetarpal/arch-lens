import { join } from 'node:path';
import { ImportExportExtractor } from '../../parser/extraction/import-export-extractor';
import { NestDeclarationExtractor } from '../../parser/extraction/nest-declaration-extractor';
import { ModuleSymbolNormalizer } from '../../parser/normalization/module-symbol-normalizer';
import { TsMorphProjectLoader } from '../../parser/project/ts-morph-project-loader';
import { DependencyGraphBuilder } from '../builder/dependency-graph-builder';
import { DependencyGraph } from '../interfaces/graph.interface';
import { CycleDetector } from './cycle-detector';

describe('CycleDetector', () => {
  const fixtureRoot = join(__dirname, '..', '__fixtures__', 'cyclic-project');
  let detector: CycleDetector;

  const buildGraph = (): DependencyGraph => {
    const normalizer = new ModuleSymbolNormalizer(
      new TsMorphProjectLoader(),
      new ImportExportExtractor(),
      new NestDeclarationExtractor(),
    );
    const files = ['a.ts', 'b.ts', 'c.ts', 'd.ts', 'entry.ts'].map((relativePath) => ({
      absolutePath: join(fixtureRoot, relativePath),
      relativePath,
      extension: '.ts',
    }));
    return new DependencyGraphBuilder().build(normalizer.normalize(files));
  };

  beforeEach(() => {
    detector = new CycleDetector();
  });

  it('finds the a -> b -> c -> a cycle as one strongly connected component', () => {
    const cycles = detector.findCycles(buildGraph());

    expect(cycles).toHaveLength(1);
    expect(cycles[0].nodeIds.sort()).toEqual(['a.ts', 'b.ts', 'c.ts']);
  });

  it('does not report acyclic nodes as cycles', () => {
    const cycles = detector.findCycles(buildGraph());

    expect(cycles.some((c) => c.nodeIds.includes('d.ts'))).toBe(false);
    expect(cycles.some((c) => c.nodeIds.includes('entry.ts'))).toBe(false);
  });

  it('includes every node across all components, cyclic or not', () => {
    const components = detector.findComponents(buildGraph());
    const allNodeIds = components.flatMap((c) => c.nodeIds).sort();

    expect(allNodeIds).toEqual(['a.ts', 'b.ts', 'c.ts', 'd.ts', 'entry.ts']);
  });

  it('detects a direct self-import as a cycle', () => {
    const graph: DependencyGraph = {
      nodes: [{ id: 'self.ts', label: 'self.ts', externalImports: [] }],
      edges: [{ from: 'self.ts', to: 'self.ts', specifier: './self' }],
    };

    const cycles = detector.findCycles(graph);

    expect(cycles).toHaveLength(1);
    expect(cycles[0].nodeIds).toEqual(['self.ts']);
  });
});
