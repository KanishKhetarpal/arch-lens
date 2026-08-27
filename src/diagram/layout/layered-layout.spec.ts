import { DiagramModel } from '../interfaces/diagram-model.interface';
import { LayeredLayout } from './layered-layout';

describe('LayeredLayout', () => {
  const model: DiagramModel = {
    nodes: [],
    edges: [],
    layers: [
      { depth: 0, nodeIds: ['b.ts', 'a.ts'] },
      { depth: 1, nodeIds: ['top.ts'] },
    ],
    cycles: [],
  };

  it('spreads nodes across x within a layer and stacks layers along y by default (vertical, sorted ids)', () => {
    const layout = new LayeredLayout();

    expect(layout.compute(model)).toEqual([
      { id: 'a.ts', x: 0, y: 0 },
      { id: 'b.ts', x: 200, y: 0 },
      { id: 'top.ts', x: 0, y: 140 },
    ]);
  });

  it('swaps axes for a horizontal direction: layers stack along x, nodes spread along y', () => {
    const layout = new LayeredLayout();

    expect(layout.compute(model, { direction: 'horizontal' })).toEqual([
      { id: 'a.ts', x: 0, y: 0 },
      { id: 'b.ts', x: 0, y: 200 },
      { id: 'top.ts', x: 140, y: 0 },
    ]);
  });

  it('honors custom node/layer spacing', () => {
    const layout = new LayeredLayout();

    expect(layout.compute(model, { nodeSpacing: 50, layerSpacing: 30 })).toEqual([
      { id: 'a.ts', x: 0, y: 0 },
      { id: 'b.ts', x: 50, y: 0 },
      { id: 'top.ts', x: 0, y: 30 },
    ]);
  });
});
