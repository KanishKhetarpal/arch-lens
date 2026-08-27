import { CycleDetector } from '../../graph/analysis/cycle-detector';
import { GraphLayering } from '../../graph/analysis/graph-layering';
import { GraphMetrics } from '../../graph/analysis/graph-metrics';
import { DataFlowGraph } from '../../dataflow/interfaces/data-flow-graph.interface';
import { DiagramModelBuilder } from './diagram-model-builder';

describe('DiagramModelBuilder', () => {
  const buildBuilder = () =>
    new DiagramModelBuilder(
      new GraphLayering(new CycleDetector()),
      new CycleDetector(),
      new GraphMetrics(),
    );

  it('resolves layer depth, metrics, and null cycleId for an acyclic graph', () => {
    const graph: DataFlowGraph = {
      nodes: [
        { id: 'leaf.ts', label: 'leaf.ts', externalImports: [] },
        { id: 'top.ts', label: 'top.ts', externalImports: [] },
      ],
      edges: [{ from: 'top.ts', to: 'leaf.ts', specifier: './leaf', dataTypes: ['CreateCatDto'] }],
      injection: { nodes: [], edges: [] },
      flows: [],
    };

    const model = buildBuilder().build(graph);

    expect(model.nodes).toEqual([
      {
        id: 'leaf.ts',
        label: 'leaf.ts',
        layerDepth: 0,
        cycleId: null,
        metrics: { nodeId: 'leaf.ts', fanIn: 1, fanOut: 0, coupling: 1, instability: 0 },
      },
      {
        id: 'top.ts',
        label: 'top.ts',
        layerDepth: 1,
        cycleId: null,
        metrics: { nodeId: 'top.ts', fanIn: 0, fanOut: 1, coupling: 1, instability: 1 },
      },
    ]);
    expect(model.edges).toEqual([
      { from: 'top.ts', to: 'leaf.ts', dataTypes: ['CreateCatDto'], cyclic: false },
    ]);
    expect(model.layers).toEqual([
      { depth: 0, nodeIds: ['leaf.ts'] },
      { depth: 1, nodeIds: ['top.ts'] },
    ]);
    expect(model.cycles).toEqual([]);
  });

  it('assigns a shared cycleId and marks in-cycle edges as cyclic', () => {
    const graph: DataFlowGraph = {
      nodes: ['a.ts', 'b.ts', 'entry.ts'].map((id) => ({ id, label: id, externalImports: [] })),
      edges: [
        { from: 'a.ts', to: 'b.ts', specifier: './b', dataTypes: [] },
        { from: 'b.ts', to: 'a.ts', specifier: './a', dataTypes: [] },
        { from: 'entry.ts', to: 'a.ts', specifier: './a', dataTypes: [] },
      ],
      injection: { nodes: [], edges: [] },
      flows: [],
    };

    const model = buildBuilder().build(graph);

    const cycleIdByNode = new Map(model.nodes.map((node) => [node.id, node.cycleId]));
    expect(cycleIdByNode.get('a.ts')).not.toBeNull();
    expect(cycleIdByNode.get('a.ts')).toEqual(cycleIdByNode.get('b.ts'));
    expect(cycleIdByNode.get('entry.ts')).toBeNull();

    expect(model.edges).toEqual([
      { from: 'a.ts', to: 'b.ts', dataTypes: [], cyclic: true },
      { from: 'b.ts', to: 'a.ts', dataTypes: [], cyclic: true },
      { from: 'entry.ts', to: 'a.ts', dataTypes: [], cyclic: false },
    ]);
    expect(model.cycles).toHaveLength(1);
    expect(model.cycles[0].nodeIds.sort()).toEqual(['a.ts', 'b.ts']);
  });
});
