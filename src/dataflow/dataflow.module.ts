import { Module } from '@nestjs/common';
import { FlowTracer } from './analysis/flow-tracer';
import { DiGraphBuilder } from './builder/di-graph-builder';

@Module({
  providers: [DiGraphBuilder, FlowTracer],
  exports: [DiGraphBuilder, FlowTracer],
})
export class DataFlowModule {}
