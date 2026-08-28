import { DiagramModel } from '../../diagram/interfaces/diagram-model.interface';
import { HotspotDetector } from './hotspot-detector';

describe('HotspotDetector', () => {
  let detector: HotspotDetector;

  beforeEach(() => {
    detector = new HotspotDetector();
  });

  it('describes each non-trivial cycle', () => {
    const model: DiagramModel = {
      nodes: [],
      edges: [],
      layers: [],
      cycles: [{ nodeIds: ['a.ts', 'b.ts'] }],
    };

    const { cycles } = detector.detect(model);

    expect(cycles).toEqual([
      {
        cycleId: 0,
        nodeIds: ['a.ts', 'b.ts'],
        description: '2 modules form a dependency cycle: a.ts -> b.ts.',
      },
    ]);
  });

  it('flags and classifies coupling hotspots above the threshold, sorted by coupling desc', () => {
    const model: DiagramModel = {
      nodes: [
        {
          id: 'magnet.ts',
          label: 'magnet.ts',
          layerDepth: 0,
          cycleId: null,
          metrics: { nodeId: 'magnet.ts', fanIn: 5, fanOut: 0, coupling: 5, instability: 0 },
        },
        {
          id: 'aggregator.ts',
          label: 'aggregator.ts',
          layerDepth: 1,
          cycleId: null,
          metrics: {
            nodeId: 'aggregator.ts',
            fanIn: 0,
            fanOut: 4,
            coupling: 4,
            instability: 1,
          },
        },
        {
          id: 'quiet.ts',
          label: 'quiet.ts',
          layerDepth: 0,
          cycleId: null,
          metrics: { nodeId: 'quiet.ts', fanIn: 1, fanOut: 0, coupling: 1, instability: 0 },
        },
      ],
      edges: [],
      layers: [],
      cycles: [],
    };

    const { coupling } = detector.detect(model);

    expect(coupling).toEqual([
      {
        nodeId: 'magnet.ts',
        coupling: 5,
        reason: 'fan-in-magnet',
        description: 'magnet.ts is depended on by 5 modules, making it a change-risk hotspot.',
      },
      {
        nodeId: 'aggregator.ts',
        coupling: 4,
        reason: 'fan-out-heavy',
        description: 'aggregator.ts depends on 4 modules, making it fragile to upstream changes.',
      },
    ]);
  });

  it('respects a custom minCoupling and labels balanced coupling', () => {
    const model: DiagramModel = {
      nodes: [
        {
          id: 'balanced.ts',
          label: 'balanced.ts',
          layerDepth: 0,
          cycleId: null,
          metrics: { nodeId: 'balanced.ts', fanIn: 2, fanOut: 2, coupling: 4, instability: 0.5 },
        },
      ],
      edges: [],
      layers: [],
      cycles: [],
    };

    expect(detector.detect(model, { minCoupling: 10 }).coupling).toEqual([]);
    expect(detector.detect(model, { minCoupling: 4 }).coupling[0]).toEqual({
      nodeId: 'balanced.ts',
      coupling: 4,
      reason: 'balanced',
      description: 'balanced.ts has balanced fan-in/fan-out (2/2) but high overall coupling.',
    });
  });
});
