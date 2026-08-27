import { DiagramModel } from '../interfaces/diagram-model.interface';
import { D3JsonExporter } from './d3-json-exporter';

describe('D3JsonExporter', () => {
  it('flattens nodes and edges into the D3 source/target shape', () => {
    const model: DiagramModel = {
      nodes: [
        {
          id: 'a.ts',
          label: 'a.ts',
          layerDepth: 1,
          cycleId: 0,
          metrics: { nodeId: 'a.ts', fanIn: 2, fanOut: 1, coupling: 3, instability: 1 / 3 },
        },
      ],
      edges: [{ from: 'a.ts', to: 'b.ts', dataTypes: ['CreateCatDto'], cyclic: true }],
      layers: [{ depth: 1, nodeIds: ['a.ts'] }],
      cycles: [{ nodeIds: ['a.ts'] }],
    };

    expect(new D3JsonExporter().export(model)).toEqual({
      nodes: [
        {
          id: 'a.ts',
          label: 'a.ts',
          layer: 1,
          cycleId: 0,
          fanIn: 2,
          fanOut: 1,
          instability: 1 / 3,
        },
      ],
      links: [{ source: 'a.ts', target: 'b.ts', dataTypes: ['CreateCatDto'], cyclic: true }],
    });
  });

  it('produces empty nodes/links arrays for an empty model', () => {
    const model: DiagramModel = { nodes: [], edges: [], layers: [], cycles: [] };

    expect(new D3JsonExporter().export(model)).toEqual({ nodes: [], links: [] });
  });
});
