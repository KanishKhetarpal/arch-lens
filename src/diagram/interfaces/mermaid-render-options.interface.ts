export interface MermaidRenderOptions {
  /** Flowchart direction: top-down or left-right. Defaults to 'TD'. */
  direction?: 'TD' | 'LR';
  /** Group nodes into `subgraph`s by layer depth. Defaults to true. */
  groupByLayer?: boolean;
}
