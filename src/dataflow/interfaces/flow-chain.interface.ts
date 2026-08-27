import { ArchitecturalLayer } from './di-graph.interface';

/** A maximal path through the DI graph rooted at a controller node. */
export interface FlowChain {
  /** Ordered DiNode ids from the controller to the deepest reachable node. */
  path: string[];
  /** Layer of each node in `path`, same order. */
  layers: ArchitecturalLayer[];
  /** True when the chain reaches a repository-layer node. */
  reachesRepository: boolean;
}
