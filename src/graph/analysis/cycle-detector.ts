import { Injectable } from '@nestjs/common';
import { DependencyGraph } from '../interfaces/graph.interface';
import { StronglyConnectedComponent } from '../interfaces/strongly-connected-component.interface';

interface TarjanState {
  index: number;
  indices: Map<string, number>;
  lowlink: Map<string, number>;
  onStack: Set<string>;
  stack: string[];
}

@Injectable()
export class CycleDetector {
  /** All strongly connected components (Tarjan's algorithm), including trivial singletons. */
  findComponents(graph: DependencyGraph): StronglyConnectedComponent[] {
    const adjacency = this.buildAdjacency(graph);
    const state: TarjanState = {
      index: 0,
      indices: new Map(),
      lowlink: new Map(),
      onStack: new Set(),
      stack: [],
    };
    const components: StronglyConnectedComponent[] = [];

    for (const node of graph.nodes) {
      if (!state.indices.has(node.id)) {
        this.strongConnect(node.id, adjacency, state, components);
      }
    }

    return components;
  }

  /** Non-trivial components only: real cycles (mutual/indirect deps or self-imports). */
  findCycles(graph: DependencyGraph): StronglyConnectedComponent[] {
    const selfLoops = new Set(
      graph.edges.filter((edge) => edge.from === edge.to).map((edge) => edge.from),
    );

    return this.findComponents(graph).filter(
      (component) => component.nodeIds.length > 1 || selfLoops.has(component.nodeIds[0]),
    );
  }

  private buildAdjacency(graph: DependencyGraph): Map<string, string[]> {
    const adjacency = new Map<string, string[]>();
    for (const node of graph.nodes) {
      adjacency.set(node.id, []);
    }
    for (const edge of graph.edges) {
      adjacency.get(edge.from)?.push(edge.to);
    }
    return adjacency;
  }

  private strongConnect(
    v: string,
    adjacency: Map<string, string[]>,
    state: TarjanState,
    components: StronglyConnectedComponent[],
  ): void {
    state.indices.set(v, state.index);
    state.lowlink.set(v, state.index);
    state.index += 1;
    state.stack.push(v);
    state.onStack.add(v);

    for (const w of adjacency.get(v) ?? []) {
      if (!state.indices.has(w)) {
        this.strongConnect(w, adjacency, state, components);
        state.lowlink.set(
          v,
          Math.min(state.lowlink.get(v) as number, state.lowlink.get(w) as number),
        );
      } else if (state.onStack.has(w)) {
        state.lowlink.set(
          v,
          Math.min(state.lowlink.get(v) as number, state.indices.get(w) as number),
        );
      }
    }

    if (state.lowlink.get(v) === state.indices.get(v)) {
      const nodeIds: string[] = [];
      let w: string;
      do {
        w = state.stack.pop() as string;
        state.onStack.delete(w);
        nodeIds.push(w);
      } while (w !== v);
      components.push({ nodeIds });
    }
  }
}
