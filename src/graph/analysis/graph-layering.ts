import { Injectable } from '@nestjs/common';
import { GraphLayer } from '../interfaces/graph-layer.interface';
import { DependencyGraph } from '../interfaces/graph.interface';
import { CycleDetector } from './cycle-detector';

@Injectable()
export class GraphLayering {
  constructor(private readonly cycleDetector: CycleDetector) {}

  /**
   * Groups nodes into dependency-order layers. Cycles are collapsed into a
   * single unit first (via SCCs), so the resulting condensation graph is
   * always acyclic and every node lands on exactly one layer, even when the
   * raw graph isn't a DAG. A node's depth is the longest path to a leaf
   * (module with no internal dependencies).
   */
  layer(graph: DependencyGraph): GraphLayer[] {
    const components = this.cycleDetector.findComponents(graph);
    const componentIndexByNode = new Map<string, number>();
    components.forEach((component, index) => {
      for (const nodeId of component.nodeIds) {
        componentIndexByNode.set(nodeId, index);
      }
    });

    const dependsOn = components.map(() => new Set<number>());
    for (const edge of graph.edges) {
      const from = componentIndexByNode.get(edge.from) as number;
      const to = componentIndexByNode.get(edge.to) as number;
      if (from !== to) {
        dependsOn[from].add(to);
      }
    }

    const depths = new Array<number>(components.length).fill(-1);
    const depthOf = (componentIndex: number): number => {
      if (depths[componentIndex] >= 0) {
        return depths[componentIndex];
      }
      const dependencies = Array.from(dependsOn[componentIndex]);
      const depth = dependencies.length === 0 ? 0 : 1 + Math.max(...dependencies.map(depthOf));
      depths[componentIndex] = depth;
      return depth;
    };

    const nodeIdsByDepth = new Map<number, string[]>();
    components.forEach((component, index) => {
      const depth = depthOf(index);
      const nodeIds = nodeIdsByDepth.get(depth) ?? [];
      nodeIds.push(...component.nodeIds);
      nodeIdsByDepth.set(depth, nodeIds);
    });

    return Array.from(nodeIdsByDepth.entries())
      .sort(([a], [b]) => a - b)
      .map(([depth, nodeIds]) => ({ depth, nodeIds: nodeIds.sort() }));
  }
}
