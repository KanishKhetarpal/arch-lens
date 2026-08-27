import { Injectable } from '@nestjs/common';
import { DependencyGraph } from '../../graph/interfaces/graph.interface';
import { ModuleSymbol } from '../../parser/interfaces/module-symbol.interface';
import { DtoEdgeAnnotator } from '../annotation/dto-edge-annotator';
import { FlowTracer } from '../analysis/flow-tracer';
import { DataFlowGraph } from '../interfaces/data-flow-graph.interface';
import { DiGraphBuilder } from './di-graph-builder';

@Injectable()
export class DataFlowGraphBuilder {
  constructor(
    private readonly diGraphBuilder: DiGraphBuilder,
    private readonly flowTracer: FlowTracer,
    private readonly dtoEdgeAnnotator: DtoEdgeAnnotator,
  ) {}

  /**
   * Merges DI injection and DTO-carrying edges on top of the structural
   * dependency graph (Phase 4) into one DataFlowGraph — nodes stay the
   * dependency graph's file nodes, edges gain `dataTypes`, and the
   * class-level injection graph plus its traced flows ride alongside.
   */
  build(symbols: ModuleSymbol[], dependencyGraph: DependencyGraph): DataFlowGraph {
    const injection = this.diGraphBuilder.build(symbols);

    return {
      nodes: dependencyGraph.nodes,
      edges: this.dtoEdgeAnnotator.annotate(dependencyGraph, symbols),
      injection,
      flows: this.flowTracer.trace(injection),
    };
  }
}
