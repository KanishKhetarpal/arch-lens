import { DependencyGraph } from '../interfaces/graph.interface';
import { GraphMetrics } from './graph-metrics';

describe('GraphMetrics', () => {
  let metrics: GraphMetrics;

  beforeEach(() => {
    metrics = new GraphMetrics();
  });

  it('computes fan-in, fan-out, coupling, and instability per node', () => {
    const graph: DependencyGraph = {
      nodes: ['leaf.ts', 'mid.ts', 'top.ts'].map((id) => ({ id, label: id, externalImports: [] })),
      edges: [
        { from: 'top.ts', to: 'mid.ts', specifier: './mid' },
        { from: 'mid.ts', to: 'leaf.ts', specifier: './leaf' },
      ],
    };

    expect(metrics.compute(graph)).toEqual(
      expect.arrayContaining([
        { nodeId: 'leaf.ts', fanIn: 1, fanOut: 0, coupling: 1, instability: 0 },
        { nodeId: 'mid.ts', fanIn: 1, fanOut: 1, coupling: 2, instability: 0.5 },
        { nodeId: 'top.ts', fanIn: 0, fanOut: 1, coupling: 1, instability: 1 },
      ]),
    );
  });

  it('reports zero instability for a fully isolated node', () => {
    const graph: DependencyGraph = {
      nodes: [{ id: 'isolated.ts', label: 'isolated.ts', externalImports: [] }],
      edges: [],
    };

    expect(metrics.compute(graph)).toEqual([
      { nodeId: 'isolated.ts', fanIn: 0, fanOut: 0, coupling: 0, instability: 0 },
    ]);
  });
});
