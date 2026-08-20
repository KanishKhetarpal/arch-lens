export interface GraphLayer {
  /** 0 = leaf modules with no internal dependencies; increases toward the modules that depend on them. */
  depth: number;
  nodeIds: string[];
}
