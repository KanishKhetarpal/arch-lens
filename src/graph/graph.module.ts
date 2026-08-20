import { Module } from '@nestjs/common';
import { CycleDetector } from './analysis/cycle-detector';
import { GraphLayering } from './analysis/graph-layering';
import { DependencyGraphBuilder } from './builder/dependency-graph-builder';

@Module({
  providers: [DependencyGraphBuilder, CycleDetector, GraphLayering],
  exports: [DependencyGraphBuilder, CycleDetector, GraphLayering],
})
export class GraphModule {}
