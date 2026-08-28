import { DataFlowGraph } from '../../dataflow/interfaces/data-flow-graph.interface';
import { DiagramModel } from '../../diagram/interfaces/diagram-model.interface';
import { ArchitectureOverviewBuilder } from './architecture-overview-builder';

describe('ArchitectureOverviewBuilder', () => {
  let builder: ArchitectureOverviewBuilder;

  beforeEach(() => {
    builder = new ArchitectureOverviewBuilder();
  });

  const baseModel: DiagramModel = {
    nodes: [
      {
        id: 'cats.controller.ts',
        label: 'cats.controller.ts',
        layerDepth: 2,
        cycleId: null,
        metrics: { nodeId: 'cats.controller.ts', fanIn: 0, fanOut: 1, coupling: 1, instability: 1 },
      },
      {
        id: 'cats.service.ts',
        label: 'cats.service.ts',
        layerDepth: 1,
        cycleId: null,
        metrics: { nodeId: 'cats.service.ts', fanIn: 1, fanOut: 1, coupling: 2, instability: 0.5 },
      },
      {
        id: 'cats.repository.ts',
        label: 'cats.repository.ts',
        layerDepth: 0,
        cycleId: null,
        metrics: { nodeId: 'cats.repository.ts', fanIn: 1, fanOut: 0, coupling: 1, instability: 0 },
      },
    ],
    edges: [],
    layers: [
      { depth: 0, nodeIds: ['cats.repository.ts'] },
      { depth: 1, nodeIds: ['cats.service.ts'] },
      { depth: 2, nodeIds: ['cats.controller.ts'] },
    ],
    cycles: [],
  };

  const flow: DataFlowGraph = {
    nodes: baseModel.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      externalImports: [],
    })),
    edges: [],
    injection: {
      nodes: [
        {
          id: 'cats.controller.ts#CatsController',
          relativePath: 'cats.controller.ts',
          className: 'CatsController',
          layer: 'controller',
        },
        {
          id: 'cats.service.ts#CatsService',
          relativePath: 'cats.service.ts',
          className: 'CatsService',
          layer: 'service',
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
          to: 'cats.service.ts#CatsService',
          paramName: 'catsService',
        },
        {
          from: 'cats.service.ts#CatsService',
          to: 'cats.repository.ts#CatsRepository',
          paramName: 'catsRepository',
        },
      ],
    },
    flows: [
      {
        path: [
          'cats.controller.ts#CatsController',
          'cats.service.ts#CatsService',
          'cats.repository.ts#CatsRepository',
        ],
        layers: ['controller', 'service', 'repository'],
        reachesRepository: true,
      },
    ],
  };

  it('counts layers, traces the longest chain per entrypoint, and describes boundaries', () => {
    const overview = builder.build(baseModel, flow);

    expect(overview.moduleCount).toBe(3);
    expect(overview.layerCounts).toEqual({ controller: 1, service: 1, repository: 1, other: 0 });
    expect(overview.entrypoints).toEqual([
      {
        controllerId: 'cats.controller.ts#CatsController',
        relativePath: 'cats.controller.ts',
        className: 'CatsController',
        reachesRepository: true,
        longestChain: ['CatsController', 'CatsService', 'CatsRepository'],
      },
    ]);
    expect(overview.boundaries).toEqual([
      'Controller modules depend on service modules.',
      'Service modules depend on repository modules.',
    ]);
    expect(overview.narrative).toContain('3 modules across 3 dependency layers');
    expect(overview.narrative).toContain('1 controller, 1 service, 1 repository');
    expect(overview.narrative).toContain('1 entrypoint (controllers)');
  });

  it('flags entrypoints whose chain never reaches a repository', () => {
    const danglingFlow: DataFlowGraph = {
      ...flow,
      flows: [
        {
          path: ['cats.controller.ts#CatsController', 'cats.service.ts#CatsService'],
          layers: ['controller', 'service'],
          reachesRepository: false,
        },
      ],
    };

    const overview = builder.build(baseModel, danglingFlow);

    expect(overview.entrypoints[0].reachesRepository).toBe(false);
    expect(overview.narrative).toContain('1 of which never reach a repository');
  });
});
