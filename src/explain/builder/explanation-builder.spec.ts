import { DataFlowGraph } from '../../dataflow/interfaces/data-flow-graph.interface';
import { DiagramModel } from '../../diagram/interfaces/diagram-model.interface';
import { HotspotDetector } from '../hotspots/hotspot-detector';
import { ArchitectureOverviewBuilder } from '../overview/architecture-overview-builder';
import { ExplanationPromptBuilder } from '../prompt/explanation-prompt-builder';
import { ModuleSummarizer } from '../summary/module-summarizer';
import { ExplanationBuilder } from './explanation-builder';

describe('ExplanationBuilder', () => {
  const buildBuilder = () =>
    new ExplanationBuilder(
      new ModuleSummarizer(),
      new ArchitectureOverviewBuilder(),
      new HotspotDetector(),
      new ExplanationPromptBuilder(),
    );

  it('composes module summaries, overview, hotspots, and a prompt from a single graph', () => {
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
      layers: [
        { depth: 0, nodeIds: ['cats.repository.ts'] },
        { depth: 1, nodeIds: ['cats.controller.ts'] },
      ],
      cycles: [],
    };

    const flow: DataFlowGraph = {
      nodes: model.nodes.map((node) => ({ id: node.id, label: node.label, externalImports: [] })),
      edges: model.edges.map((edge) => ({ ...edge, specifier: './cats.repository' })),
      injection: {
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
        edges: [
          {
            from: 'cats.controller.ts#CatsController',
            to: 'cats.repository.ts#CatsRepository',
            paramName: 'catsRepository',
          },
        ],
      },
      flows: [
        {
          path: ['cats.controller.ts#CatsController', 'cats.repository.ts#CatsRepository'],
          layers: ['controller', 'repository'],
          reachesRepository: true,
        },
      ],
    };

    const explanation = buildBuilder().build(model, flow);

    expect(explanation.moduleSummaries).toHaveLength(2);
    expect(explanation.moduleSummaries[0].sentence).toContain('cats.controller.ts is a controller');

    expect(explanation.overview.moduleCount).toBe(2);
    expect(explanation.overview.entrypoints).toEqual([
      {
        controllerId: 'cats.controller.ts#CatsController',
        relativePath: 'cats.controller.ts',
        className: 'CatsController',
        reachesRepository: true,
        longestChain: ['CatsController', 'CatsRepository'],
      },
    ]);

    expect(explanation.hotspots).toEqual({ cycles: [], coupling: [] });

    expect(explanation.prompt).toContain('# Architecture Explanation Request');
    expect(explanation.prompt).toContain('cats.controller.ts is a controller module');
    expect(explanation.prompt).toContain('CatsController (cats.controller.ts)');
  });
});
