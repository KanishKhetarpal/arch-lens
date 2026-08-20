export interface StronglyConnectedComponent {
  /**
   * Node ids (relativePaths) in this component. Length > 1 means a real
   * cycle; length 1 means either an isolated node or a self-import.
   */
  nodeIds: string[];
}
