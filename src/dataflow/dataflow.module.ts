import { Module } from '@nestjs/common';
import { DiGraphBuilder } from './builder/di-graph-builder';

@Module({
  providers: [DiGraphBuilder],
  exports: [DiGraphBuilder],
})
export class DataFlowModule {}
