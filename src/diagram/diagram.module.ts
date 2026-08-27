import { Module } from '@nestjs/common';
import { GraphModule } from '../graph/graph.module';
import { DiagramModelBuilder } from './builder/diagram-model-builder';
import { MermaidRenderer } from './renderers/mermaid-renderer';

@Module({
  imports: [GraphModule],
  providers: [DiagramModelBuilder, MermaidRenderer],
  exports: [DiagramModelBuilder, MermaidRenderer],
})
export class DiagramModule {}
