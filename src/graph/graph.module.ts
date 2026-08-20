import { Module } from '@nestjs/common';
import { CycleDetector } from './analysis/cycle-detector';
import { DependencyGraphBuilder } from './builder/dependency-graph-builder';

@Module({
  providers: [DependencyGraphBuilder, CycleDetector],
  exports: [DependencyGraphBuilder, CycleDetector],
})
export class GraphModule {}
