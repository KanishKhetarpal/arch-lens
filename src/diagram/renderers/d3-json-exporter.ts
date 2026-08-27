import { Injectable } from '@nestjs/common';
import { D3Graph } from '../interfaces/d3-graph.interface';
import { DiagramModel } from '../interfaces/diagram-model.interface';

@Injectable()
export class D3JsonExporter {
  /** Flattens a DiagramModel into the plain nodes/links shape D3 force/hierarchy layouts expect. */
  export(model: DiagramModel): D3Graph {
    return {
      nodes: model.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        layer: node.layerDepth,
        cycleId: node.cycleId,
        fanIn: node.metrics.fanIn,
        fanOut: node.metrics.fanOut,
        instability: node.metrics.instability,
      })),
      links: model.edges.map((edge) => ({
        source: edge.from,
        target: edge.to,
        dataTypes: edge.dataTypes,
        cyclic: edge.cyclic,
      })),
    };
  }
}
