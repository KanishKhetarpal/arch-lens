import { Injectable } from '@nestjs/common';
import { CycleDetector } from '../../graph/analysis/cycle-detector';
import { GraphLayering } from '../../graph/analysis/graph-layering';
import { GraphMetrics } from '../../graph/analysis/graph-metrics';
import { NodeMetrics } from '../../graph/interfaces/node-metrics.interface';
import { DataFlowGraph } from '../../dataflow/interfaces/data-flow-graph.interface';
import { DiagramEdge, DiagramModel, DiagramNode } from '../interfaces/diagram-model.interface';

const EMPTY_METRICS = (nodeId: string): NodeMetrics => ({
  nodeId,
  fanIn: 0,
  fanOut: 0,
  coupling: 0,
  instability: 0,
});

@Injectable()
export class DiagramModelBuilder {
  constructor(
    private readonly graphLayering: GraphLayering,
    private readonly cycleDetector: CycleDetector,
    private readonly graphMetrics: GraphMetrics,
  ) {}

  build(graph: DataFlowGraph): DiagramModel {
    const layers = this.graphLayering.layer(graph);
    const cycles = this.cycleDetector.findCycles(graph);
    const metrics = this.graphMetrics.compute(graph);

    const layerDepthByNode = new Map<string, number>();
    for (const layer of layers) {
      for (const nodeId of layer.nodeIds) {
        layerDepthByNode.set(nodeId, layer.depth);
      }
    }

    const cycleIdByNode = new Map<string, number>();
    cycles.forEach((cycle, index) => {
      for (const nodeId of cycle.nodeIds) {
        cycleIdByNode.set(nodeId, index);
      }
    });

    const metricsByNode = new Map(metrics.map((nodeMetrics) => [nodeMetrics.nodeId, nodeMetrics]));

    const nodes: DiagramNode[] = graph.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      layerDepth: layerDepthByNode.get(node.id) ?? 0,
      cycleId: cycleIdByNode.get(node.id) ?? null,
      metrics: metricsByNode.get(node.id) ?? EMPTY_METRICS(node.id),
    }));

    const edges: DiagramEdge[] = graph.edges.map((edge) => ({
      from: edge.from,
      to: edge.to,
      dataTypes: edge.dataTypes,
      cyclic:
        cycleIdByNode.has(edge.from) && cycleIdByNode.get(edge.from) === cycleIdByNode.get(edge.to),
    }));

    return { nodes, edges, layers, cycles };
  }
}
