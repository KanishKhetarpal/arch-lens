import { ArchitecturalLayer } from '../../dataflow/interfaces/di-graph.interface';

/** A controller-rooted entrypoint and how deep its DI chain reaches. */
export interface EntrypointSummary {
  /** DiNode id (`${relativePath}#${className}`) of the controller. */
  controllerId: string;
  relativePath: string;
  className: string;
  reachesRepository: boolean;
  /** Class names along the longest traced FlowChain from this controller. */
  longestChain: string[];
}

/** Describes the codebase's layers, entrypoints, and layer-to-layer boundaries. */
export interface ArchitectureOverview {
  moduleCount: number;
  layerCounts: Record<ArchitecturalLayer, number>;
  entrypoints: EntrypointSummary[];
  /** Sentences describing which layers call which, e.g. "Controller modules depend on service modules." */
  boundaries: string[];
  narrative: string;
}
