import { Module } from '@nestjs/common';
import { DtoEdgeAnnotator } from './annotation/dto-edge-annotator';
import { FlowTracer } from './analysis/flow-tracer';
import { DataFlowGraphBuilder } from './builder/data-flow-graph-builder';
import { DiGraphBuilder } from './builder/di-graph-builder';

@Module({
  providers: [DiGraphBuilder, FlowTracer, DtoEdgeAnnotator, DataFlowGraphBuilder],
  exports: [DiGraphBuilder, FlowTracer, DtoEdgeAnnotator, DataFlowGraphBuilder],
})
export class DataFlowModule {}
