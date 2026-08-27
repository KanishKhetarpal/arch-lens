import { Injectable } from '@nestjs/common';
import { DiEdge, DiGraph, DiNode } from '../interfaces/di-graph.interface';
import { FlowChain } from '../interfaces/flow-chain.interface';

@Injectable()
export class FlowTracer {
  /**
   * Traces every maximal path starting at a controller node through the DI
   * graph. A path ends when there's nowhere further to go — no outgoing
   * edges, or every neighbor is already on the path, so cycles in the
   * injection graph don't loop forever. Controller -> service -> repository
   * is the expected shape, but any depth or branching is captured as-is.
   */
  trace(graph: DiGraph): FlowChain[] {
    const edgesByFrom = new Map<string, DiEdge[]>();
    for (const edge of graph.edges) {
      const edges = edgesByFrom.get(edge.from) ?? [];
      edges.push(edge);
      edgesByFrom.set(edge.from, edges);
    }
    const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));

    const chains: FlowChain[] = [];
    for (const node of graph.nodes) {
      if (node.layer !== 'controller') {
        continue;
      }
      this.walk(node.id, [node.id], new Set([node.id]), edgesByFrom, nodeById, chains);
    }
    return chains;
  }

  private walk(
    current: string,
    path: string[],
    visited: Set<string>,
    edgesByFrom: Map<string, DiEdge[]>,
    nodeById: Map<string, DiNode>,
    chains: FlowChain[],
  ): void {
    const next = (edgesByFrom.get(current) ?? []).filter((edge) => !visited.has(edge.to));

    if (next.length === 0) {
      chains.push(this.toChain(path, nodeById));
      return;
    }

    for (const edge of next) {
      visited.add(edge.to);
      this.walk(edge.to, [...path, edge.to], visited, edgesByFrom, nodeById, chains);
      visited.delete(edge.to);
    }
  }

  private toChain(path: string[], nodeById: Map<string, DiNode>): FlowChain {
    const layers = path.map((id) => nodeById.get(id)?.layer ?? 'other');
    return { path, layers, reachesRepository: layers.includes('repository') };
  }
}
