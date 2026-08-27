import { Module } from '@nestjs/common';
import { DtoEdgeAnnotator } from './annotation/dto-edge-annotator';
import { FlowTracer } from './analysis/flow-tracer';
import { DiGraphBuilder } from './builder/di-graph-builder';

@Module({
  providers: [DiGraphBuilder, FlowTracer, DtoEdgeAnnotator],
  exports: [DiGraphBuilder, FlowTracer, DtoEdgeAnnotator],
})
export class DataFlowModule {}
