import { DependencyGraph } from '../interfaces/graph.interface';
import { CycleDetector } from './cycle-detector';
import { GraphLayering } from './graph-layering';

describe('GraphLayering', () => {
  let layering: GraphLayering;

  beforeEach(() => {
    layering = new GraphLayering(new CycleDetector());
  });

  it('places leaf modules at depth 0 and their dependents at increasing depths', () => {
    const graph: DependencyGraph = {
      nodes: ['leaf.ts', 'mid.ts', 'top.ts'].map((id) => ({ id, label: id, externalImports: [] })),
      edges: [
        { from: 'top.ts', to: 'mid.ts', specifier: './mid' },
        { from: 'mid.ts', to: 'leaf.ts', specifier: './leaf' },
      ],
    };

    expect(layering.layer(graph)).toEqual([
      { depth: 0, nodeIds: ['leaf.ts'] },
      { depth: 1, nodeIds: ['mid.ts'] },
      { depth: 2, nodeIds: ['top.ts'] },
    ]);
  });

  it('takes the longest path when a node has dependencies at different depths', () => {
    const graph: DependencyGraph = {
      nodes: ['leaf.ts', 'mid.ts', 'top.ts'].map((id) => ({ id, label: id, externalImports: [] })),
      edges: [
        { from: 'top.ts', to: 'leaf.ts', specifier: './leaf' },
        { from: 'top.ts', to: 'mid.ts', specifier: './mid' },
        { from: 'mid.ts', to: 'leaf.ts', specifier: './leaf' },
      ],
    };

    expect(layering.layer(graph)).toEqual([
      { depth: 0, nodeIds: ['leaf.ts'] },
      { depth: 1, nodeIds: ['mid.ts'] },
      { depth: 2, nodeIds: ['top.ts'] },
    ]);
  });

  it('collapses a cycle into a single layer shared by all its members', () => {
    const graph: DependencyGraph = {
      nodes: ['a.ts', 'b.ts', 'entry.ts'].map((id) => ({ id, label: id, externalImports: [] })),
      edges: [
        { from: 'a.ts', to: 'b.ts', specifier: './b' },
        { from: 'b.ts', to: 'a.ts', specifier: './a' },
        { from: 'entry.ts', to: 'a.ts', specifier: './a' },
      ],
    };

    expect(layering.layer(graph)).toEqual([
      { depth: 0, nodeIds: ['a.ts', 'b.ts'] },
      { depth: 1, nodeIds: ['entry.ts'] },
    ]);
  });
});
