import { DiGraph } from '../../dataflow/interfaces/di-graph.interface';
import { DiagramModel } from '../../diagram/interfaces/diagram-model.interface';
import { ModuleSummarizer } from './module-summarizer';

describe('ModuleSummarizer', () => {
  let summarizer: ModuleSummarizer;

  beforeEach(() => {
    summarizer = new ModuleSummarizer();
  });

  it('summarizes a controller depending on a repository with a carried Dto', () => {
    const model: DiagramModel = {
      nodes: [
        {
          id: 'cats.controller.ts',
          label: 'cats.controller.ts',
          layerDepth: 1,
          cycleId: null,
          metrics: {
            nodeId: 'cats.controller.ts',
            fanIn: 0,
            fanOut: 1,
            coupling: 1,
            instability: 1,
          },
        },
        {
          id: 'cats.repository.ts',
          label: 'cats.repository.ts',
          layerDepth: 0,
          cycleId: null,
          metrics: {
            nodeId: 'cats.repository.ts',
            fanIn: 1,
            fanOut: 0,
            coupling: 1,
            instability: 0,
          },
        },
      ],
      edges: [
        {
          from: 'cats.controller.ts',
          to: 'cats.repository.ts',
          dataTypes: ['CreateCatDto'],
          cyclic: false,
        },
      ],
      layers: [],
      cycles: [],
    };

    const injection: DiGraph = {
      nodes: [
        {
          id: 'cats.controller.ts#CatsController',
          relativePath: 'cats.controller.ts',
          className: 'CatsController',
          layer: 'controller',
        },
        {
          id: 'cats.repository.ts#CatsRepository',
          relativePath: 'cats.repository.ts',
          className: 'CatsRepository',
          layer: 'repository',
        },
      ],
      edges: [],
    };

    const summaries = summarizer.summarize(model, injection);

    expect(summaries).toEqual([
      {
        id: 'cats.controller.ts',
        label: 'cats.controller.ts',
        layers: ['controller'],
        metrics: model.nodes[0].metrics,
        inCycle: false,
        dependsOn: ['cats.repository.ts'],
        dependedOnBy: [],
        dataTypes: ['CreateCatDto'],
        sentence:
          'cats.controller.ts is a controller module. It depends on 1 module (cats.repository.ts). ' +
          'Nothing else in the codebase depends on it. It carries CreateCatDto across its dependencies.',
      },
      {
        id: 'cats.repository.ts',
        label: 'cats.repository.ts',
        layers: ['repository'],
        metrics: model.nodes[1].metrics,
        inCycle: false,
        dependsOn: [],
        dependedOnBy: ['cats.controller.ts'],
        dataTypes: [],
        sentence:
          'cats.repository.ts is a repository module. It has no internal dependencies. ' +
          'It is depended on by 1 module (cats.controller.ts).',
      },
    ]);
  });

  it('flags cycle membership and falls back to "plain module" without DI layers', () => {
    const model: DiagramModel = {
      nodes: [
        {
          id: 'a.ts',
          label: 'a.ts',
          layerDepth: 0,
          cycleId: 0,
          metrics: { nodeId: 'a.ts', fanIn: 1, fanOut: 1, coupling: 2, instability: 0.5 },
        },
      ],
      edges: [],
      layers: [],
      cycles: [{ nodeIds: ['a.ts', 'b.ts'] }],
    };

    const [summary] = summarizer.summarize(model, { nodes: [], edges: [] });

    expect(summary.layers).toEqual([]);
    expect(summary.inCycle).toBe(true);
    expect(summary.sentence).toContain('a.ts is a plain module.');
    expect(summary.sentence).toContain('It participates in a dependency cycle.');
  });
});
