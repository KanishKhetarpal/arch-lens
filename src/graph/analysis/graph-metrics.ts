import { Injectable } from '@nestjs/common';
import { DependencyGraph } from '../interfaces/graph.interface';
import { NodeMetrics } from '../interfaces/node-metrics.interface';

@Injectable()
export class GraphMetrics {
  compute(graph: DependencyGraph): NodeMetrics[] {
    const fanIn = new Map(graph.nodes.map((node) => [node.id, 0]));
    const fanOut = new Map(graph.nodes.map((node) => [node.id, 0]));

    for (const edge of graph.edges) {
      fanOut.set(edge.from, (fanOut.get(edge.from) ?? 0) + 1);
      fanIn.set(edge.to, (fanIn.get(edge.to) ?? 0) + 1);
    }

    return graph.nodes.map((node) => {
      const nodeFanIn = fanIn.get(node.id) ?? 0;
      const nodeFanOut = fanOut.get(node.id) ?? 0;
      const coupling = nodeFanIn + nodeFanOut;

      return {
        nodeId: node.id,
        fanIn: nodeFanIn,
        fanOut: nodeFanOut,
        coupling,
        instability: coupling === 0 ? 0 : nodeFanOut / coupling,
      };
    });
  }
}
