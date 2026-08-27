import { Module } from '@nestjs/common';
import { GraphModule } from '../graph/graph.module';
import { DiagramModelBuilder } from './builder/diagram-model-builder';
import { D3JsonExporter } from './renderers/d3-json-exporter';
import { MermaidRenderer } from './renderers/mermaid-renderer';

@Module({
  imports: [GraphModule],
  providers: [DiagramModelBuilder, MermaidRenderer, D3JsonExporter],
  exports: [DiagramModelBuilder, MermaidRenderer, D3JsonExporter],
})
export class DiagramModule {}
