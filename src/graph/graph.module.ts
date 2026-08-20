import { Module } from '@nestjs/common';
import { CycleDetector } from './analysis/cycle-detector';
import { GraphLayering } from './analysis/graph-layering';
import { GraphMetrics } from './analysis/graph-metrics';
import { DependencyGraphBuilder } from './builder/dependency-graph-builder';

@Module({
  providers: [DependencyGraphBuilder, CycleDetector, GraphLayering, GraphMetrics],
  exports: [DependencyGraphBuilder, CycleDetector, GraphLayering, GraphMetrics],
})
export class GraphModule {}
