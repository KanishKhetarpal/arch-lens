import { Injectable } from '@nestjs/common';
import { DataFlowGraph } from '../../dataflow/interfaces/data-flow-graph.interface';
import { ArchitecturalLayer, DiNode } from '../../dataflow/interfaces/di-graph.interface';
import { DiagramModel } from '../../diagram/interfaces/diagram-model.interface';
import {
  ArchitectureOverview,
  EntrypointSummary,
} from '../interfaces/architecture-overview.interface';

const LAYER_ORDER: ArchitecturalLayer[] = ['controller', 'service', 'repository', 'other'];

@Injectable()
export class ArchitectureOverviewBuilder {
  /**
   * Describes the codebase at the architecture level: how many modules per
   * layer, which controllers are entrypoints and how deep their traced DI
   * chains reach, and which layers call which — all read off the DI
   * injection graph and traced flows already computed in Phase 5.
   */
  build(model: DiagramModel, flow: DataFlowGraph): ArchitectureOverview {
    const layerCounts = this.countLayers(flow);
    const entrypoints = this.buildEntrypoints(flow);
    const boundaries = this.describeBoundaries(flow);
    const narrative = this.buildNarrative(model, layerCounts, entrypoints);

    return {
      moduleCount: model.nodes.length,
      layerCounts,
      entrypoints,
      boundaries,
      narrative,
    };
  }

  private countLayers(flow: DataFlowGraph): Record<ArchitecturalLayer, number> {
    const counts: Record<ArchitecturalLayer, number> = {
      controller: 0,
      service: 0,
      repository: 0,
      other: 0,
    };
    for (const node of flow.injection.nodes) {
      counts[node.layer] += 1;
    }
    return counts;
  }

  private buildEntrypoints(flow: DataFlowGraph): EntrypointSummary[] {
    const nodeById = new Map(flow.injection.nodes.map((node) => [node.id, node]));
    const controllers = flow.injection.nodes.filter((node) => node.layer === 'controller');

    return controllers.map((controller) => {
      const chains = flow.flows.filter((chain) => chain.path[0] === controller.id);
      const longestChain = chains.reduce<string[]>(
        (longest, chain) => (chain.path.length > longest.length ? chain.path : longest),
        [controller.id],
      );
      const reachesRepository = chains.some((chain) => chain.reachesRepository);

      return {
        controllerId: controller.id,
        relativePath: controller.relativePath,
        className: controller.className,
        reachesRepository,
        longestChain: longestChain.map((id) => nodeById.get(id)?.className ?? id),
      };
    });
  }

  private describeBoundaries(flow: DataFlowGraph): string[] {
    const nodeById = new Map<string, DiNode>(flow.injection.nodes.map((node) => [node.id, node]));
    const pairs = new Set<string>();

    for (const edge of flow.injection.edges) {
      const fromLayer = nodeById.get(edge.from)?.layer;
      const toLayer = nodeById.get(edge.to)?.layer;
      if (fromLayer && toLayer && fromLayer !== toLayer) {
        pairs.add(`${fromLayer} ${toLayer}`);
      }
    }

    return Array.from(pairs)
      .sort()
      .map((pair) => {
        const [from, to] = pair.split(' ');
        return `${capitalize(from)} modules depend on ${to} modules.`;
      });
  }

  private buildNarrative(
    model: DiagramModel,
    layerCounts: Record<ArchitecturalLayer, number>,
    entrypoints: EntrypointSummary[],
  ): string {
    const layerBits = LAYER_ORDER.filter((layer) => layerCounts[layer] > 0).map(
      (layer) => `${layerCounts[layer]} ${layer}${layerCounts[layer] === 1 ? '' : 's'}`,
    );

    const sentences = [
      `The codebase has ${model.nodes.length} module${model.nodes.length === 1 ? '' : 's'} across ${model.layers.length} dependency layer${model.layers.length === 1 ? '' : 's'}.`,
    ];

    if (layerBits.length > 0) {
      sentences.push(`It is organized into ${layerBits.join(', ')}.`);
    }

    if (entrypoints.length > 0) {
      const dangling = entrypoints.filter((entrypoint) => !entrypoint.reachesRepository).length;
      const danglingNote = dangling > 0 ? `, ${dangling} of which never reach a repository` : '';
      sentences.push(
        `There ${entrypoints.length === 1 ? 'is' : 'are'} ${entrypoints.length} entrypoint${entrypoints.length === 1 ? '' : 's'} (controllers)${danglingNote}.`,
      );
    }

    if (model.cycles.length > 0) {
      sentences.push(
        `${model.cycles.length} dependency cycle${model.cycles.length === 1 ? '' : 's'} ${model.cycles.length === 1 ? 'was' : 'were'} detected.`,
      );
    }

    return sentences.join(' ');
  }
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
