import { GraphEdge } from '../../graph/interfaces/graph.interface';

export interface DtoAnnotatedEdge extends GraphEdge {
  /** Dto-suffixed type names imported across this edge, e.g. ["CreateCatDto"]. */
  dataTypes: string[];
}
