import { Module } from '@nestjs/common';
import { GraphModule } from '../graph/graph.module';
import { DiagramModelBuilder } from './builder/diagram-model-builder';
import { LayeredLayout } from './layout/layered-layout';
import { D3JsonExporter } from './renderers/d3-json-exporter';
import { HtmlDiagramRenderer } from './renderers/html-diagram-renderer';
import { MermaidRenderer } from './renderers/mermaid-renderer';

@Module({
  imports: [GraphModule],
  providers: [
    DiagramModelBuilder,
    MermaidRenderer,
    D3JsonExporter,
    LayeredLayout,
    HtmlDiagramRenderer,
  ],
  exports: [
    DiagramModelBuilder,
    MermaidRenderer,
    D3JsonExporter,
    LayeredLayout,
    HtmlDiagramRenderer,
  ],
})
export class DiagramModule {}
