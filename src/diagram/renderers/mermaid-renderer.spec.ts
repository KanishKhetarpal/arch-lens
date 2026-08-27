import { DiagramModel } from '../interfaces/diagram-model.interface';
import { MermaidRenderer } from './mermaid-renderer';

describe('MermaidRenderer', () => {
  let renderer: MermaidRenderer;

  const twoLayerModel: DiagramModel = {
    nodes: [
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
    ],
    edges: [{ from: 'top.ts', to: 'leaf.ts', dataTypes: ['CreateCatDto'], cyclic: false }],
    layers: [
      { depth: 0, nodeIds: ['leaf.ts'] },
      { depth: 1, nodeIds: ['top.ts'] },
    ],
    cycles: [],
  };

  beforeEach(() => {
    renderer = new MermaidRenderer();
  });

  it('renders a top-down flowchart grouped into layer subgraphs, with edges labelled by their Dto types', () => {
    expect(renderer.render(twoLayerModel)).toBe(
      [
        'flowchart TD',
        '  subgraph L0["Layer 0"]',
        '    leaf_ts["leaf.ts"]',
        '  end',
        '  subgraph L1["Layer 1"]',
        '    top_ts["top.ts"]',
        '  end',
        '  top_ts -->|CreateCatDto| leaf_ts',
      ].join('\n'),
    );
  });

  it('honors the LR direction and groupByLayer: false options', () => {
    const output = renderer.render(twoLayerModel, { direction: 'LR', groupByLayer: false });

    expect(output).toBe(
      [
        'flowchart LR',
        '  leaf_ts["leaf.ts"]',
        '  top_ts["top.ts"]',
        '  top_ts -->|CreateCatDto| leaf_ts',
      ].join('\n'),
    );
  });

  it('styles cyclic nodes with a classDef', () => {
    const model: DiagramModel = {
      nodes: [
        {
          id: 'a.ts',
          label: 'a.ts',
          layerDepth: 0,
          cycleId: 0,
          metrics: { nodeId: 'a.ts', fanIn: 1, fanOut: 1, coupling: 2, instability: 0.5 },
        },
        {
          id: 'b.ts',
          label: 'b.ts',
          layerDepth: 0,
          cycleId: 0,
          metrics: { nodeId: 'b.ts', fanIn: 1, fanOut: 1, coupling: 2, instability: 0.5 },
        },
      ],
      edges: [
        { from: 'a.ts', to: 'b.ts', dataTypes: [], cyclic: true },
        { from: 'b.ts', to: 'a.ts', dataTypes: [], cyclic: true },
      ],
      layers: [{ depth: 0, nodeIds: ['a.ts', 'b.ts'] }],
      cycles: [{ nodeIds: ['a.ts', 'b.ts'] }],
    };

    const output = renderer.render(model, { groupByLayer: false });

    expect(output).toContain('classDef cycle fill:#f66,stroke:#900,color:#fff');
    expect(output).toContain('class a_ts,b_ts cycle');
  });

  it('sanitizes node ids containing path separators and dots into valid Mermaid identifiers', () => {
    const model: DiagramModel = {
      nodes: [
        {
          id: 'src/cats/cats.service.ts',
          label: 'cats.service.ts',
          layerDepth: 0,
          cycleId: null,
          metrics: {
            nodeId: 'src/cats/cats.service.ts',
            fanIn: 0,
            fanOut: 0,
            coupling: 0,
            instability: 0,
          },
        },
      ],
      edges: [],
      layers: [{ depth: 0, nodeIds: ['src/cats/cats.service.ts'] }],
      cycles: [],
    };

    const output = renderer.render(model, { groupByLayer: false });

    expect(output).toContain('src_cats_cats_service_ts["cats.service.ts"]');
  });
});
