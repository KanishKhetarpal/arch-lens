import { GraphLayer } from '../../graph/interfaces/graph-layer.interface';
import { NodeMetrics } from '../../graph/interfaces/node-metrics.interface';
import { StronglyConnectedComponent } from '../../graph/interfaces/strongly-connected-component.interface';

export interface DiagramNode {
  /** relativePath — matches GraphNode.id / DiagramEdge.from|to. */
  id: string;
  label: string;
  /** GraphLayer.depth this node was placed in. */
  layerDepth: number;
  /** Index into DiagramModel.cycles, or null when the node isn't part of a real cycle. */
  cycleId: number | null;
  metrics: NodeMetrics;
}

export interface DiagramEdge {
  from: string;
  to: string;
  /** Dto-suffixed type names carried across this edge, if any (Phase 5). */
  dataTypes: string[];
  /** True when both endpoints belong to the same strongly connected component. */
  cyclic: boolean;
}

/**
 * Presentation-ready model the diagram renderers (Mermaid, D3, HTML/SVG) all
 * consume — the dependency graph with layering, cycle, and metrics analysis
 * (Phase 4) already resolved onto each node and edge, so renderers don't
 * repeat that analysis.
 */
export interface DiagramModel {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  layers: GraphLayer[];
  cycles: StronglyConnectedComponent[];
}
