export interface NodeMetrics {
  nodeId: string;
  /** Number of modules that import this one. */
  fanIn: number;
  /** Number of internal modules this one imports. */
  fanOut: number;
  /** fanIn + fanOut. */
  coupling: number;
  /** Martin's instability metric: fanOut / (fanIn + fanOut). 0 = maximally stable, 1 = maximally unstable. */
  instability: number;
}
