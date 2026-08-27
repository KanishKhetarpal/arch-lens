import { DependencyGraph } from '../../graph/interfaces/graph.interface';
import { DiGraph } from './di-graph.interface';
import { DtoAnnotatedEdge } from './dto-annotated-edge.interface';
import { FlowChain } from './flow-chain.interface';

/**
 * The structural dependency graph (Phase 4) with data-flow layered on top:
 * edges tagged with the Dto types they carry, plus the DI injection graph
 * and traced controller-rooted flows that produced them.
 */
export interface DataFlowGraph extends Omit<DependencyGraph, 'edges'> {
  edges: DtoAnnotatedEdge[];
  injection: DiGraph;
  flows: FlowChain[];
}
