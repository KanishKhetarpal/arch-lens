import { Module } from '@nestjs/common';
import { DependencyGraphBuilder } from './builder/dependency-graph-builder';

@Module({
  providers: [DependencyGraphBuilder],
  exports: [DependencyGraphBuilder],
})
export class GraphModule {}
