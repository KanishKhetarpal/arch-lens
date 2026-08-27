import { DiGraph, DiNode } from '../interfaces/di-graph.interface';
import { FlowTracer } from './flow-tracer';

describe('FlowTracer', () => {
  let tracer: FlowTracer;

  const node = (id: string, layer: DiNode['layer']): DiNode => ({
    id,
    relativePath: `${id}.ts`,
    className: id,
    layer,
  });

  beforeEach(() => {
    tracer = new FlowTracer();
  });

  it('traces a controller -> service -> repository chain', () => {
    const graph: DiGraph = {
      nodes: [
        node('Controller', 'controller'),
        node('Service', 'service'),
        node('Repository', 'repository'),
      ],
      edges: [
        { from: 'Controller', to: 'Service', paramName: 'service' },
        { from: 'Service', to: 'Repository', paramName: 'repository' },
      ],
    };

    expect(tracer.trace(graph)).toEqual([
      {
        path: ['Controller', 'Service', 'Repository'],
        layers: ['controller', 'service', 'repository'],
        reachesRepository: true,
      },
    ]);
  });

  it('reports reachesRepository: false when the chain dead-ends at a service', () => {
    const graph: DiGraph = {
      nodes: [node('Controller', 'controller'), node('Service', 'service')],
      edges: [{ from: 'Controller', to: 'Service', paramName: 'service' }],
    };

    expect(tracer.trace(graph)).toEqual([
      {
        path: ['Controller', 'Service'],
        layers: ['controller', 'service'],
        reachesRepository: false,
      },
    ]);
  });

  it('emits one chain per branch when a controller injects multiple services', () => {
    const graph: DiGraph = {
      nodes: [
        node('Controller', 'controller'),
        node('ServiceA', 'service'),
        node('ServiceB', 'service'),
      ],
      edges: [
        { from: 'Controller', to: 'ServiceA', paramName: 'a' },
        { from: 'Controller', to: 'ServiceB', paramName: 'b' },
      ],
    };

    const chains = tracer.trace(graph);

    expect(chains).toHaveLength(2);
    expect(chains.map((chain) => chain.path)).toEqual(
      expect.arrayContaining([
        ['Controller', 'ServiceA'],
        ['Controller', 'ServiceB'],
      ]),
    );
  });

  it('stops instead of looping forever when the injection graph has a cycle', () => {
    const graph: DiGraph = {
      nodes: [
        node('Controller', 'controller'),
        node('ServiceA', 'service'),
        node('ServiceB', 'service'),
      ],
      edges: [
        { from: 'Controller', to: 'ServiceA', paramName: 'a' },
        { from: 'ServiceA', to: 'ServiceB', paramName: 'b' },
        { from: 'ServiceB', to: 'ServiceA', paramName: 'a' },
      ],
    };

    expect(tracer.trace(graph)).toEqual([
      {
        path: ['Controller', 'ServiceA', 'ServiceB'],
        layers: ['controller', 'service', 'service'],
        reachesRepository: false,
      },
    ]);
  });

  it('returns no chains when there are no controller nodes', () => {
    const graph: DiGraph = {
      nodes: [node('Service', 'service'), node('Repository', 'repository')],
      edges: [{ from: 'Service', to: 'Repository', paramName: 'repository' }],
    };

    expect(tracer.trace(graph)).toEqual([]);
  });
});
