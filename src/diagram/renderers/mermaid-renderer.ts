import { Injectable } from '@nestjs/common';
import { DiagramModel, DiagramNode } from '../interfaces/diagram-model.interface';
import { MermaidRenderOptions } from '../interfaces/mermaid-render-options.interface';

@Injectable()
export class MermaidRenderer {
  /** Renders a DiagramModel as a Mermaid `flowchart` definition. */
  render(model: DiagramModel, options: MermaidRenderOptions = {}): string {
    const direction = options.direction ?? 'TD';
    const groupByLayer = options.groupByLayer ?? true;
    const idFor = this.buildIdMap(model.nodes);

    const lines: string[] = [`flowchart ${direction}`];
    lines.push(...this.renderNodes(model, idFor, groupByLayer));
    lines.push(...this.renderEdges(model, idFor));
    lines.push(...this.renderCycleStyling(model, idFor));

    return lines.join('\n');
  }

  private renderNodes(
    model: DiagramModel,
    idFor: Map<string, string>,
    groupByLayer: boolean,
  ): string[] {
    if (!groupByLayer) {
      return model.nodes.map((node) => `  ${idFor.get(node.id)}["${this.escapeLabel(node.label)}"]`);
    }

    const nodesByDepth = new Map<number, DiagramNode[]>();
    for (const node of model.nodes) {
      const bucket = nodesByDepth.get(node.layerDepth) ?? [];
      bucket.push(node);
      nodesByDepth.set(node.layerDepth, bucket);
    }

    const lines: string[] = [];
    for (const depth of Array.from(nodesByDepth.keys()).sort((a, b) => a - b)) {
      lines.push(`  subgraph L${depth}["Layer ${depth}"]`);
      for (const node of nodesByDepth.get(depth) as DiagramNode[]) {
        lines.push(`    ${idFor.get(node.id)}["${this.escapeLabel(node.label)}"]`);
      }
      lines.push('  end');
    }
    return lines;
  }

  private renderEdges(model: DiagramModel, idFor: Map<string, string>): string[] {
    const lines: string[] = [];
    for (const edge of model.edges) {
      const from = idFor.get(edge.from);
      const to = idFor.get(edge.to);
      if (!from || !to) {
        continue;
      }
      const label = edge.dataTypes.length > 0 ? `|${edge.dataTypes.join(', ')}|` : '';
      lines.push(`  ${from} -->${label} ${to}`);
    }
    return lines;
  }

  private renderCycleStyling(model: DiagramModel, idFor: Map<string, string>): string[] {
    const cyclicIds = model.nodes
      .filter((node) => node.cycleId !== null)
      .map((node) => idFor.get(node.id) as string);
    if (cyclicIds.length === 0) {
      return [];
    }
    return ['  classDef cycle fill:#f66,stroke:#900,color:#fff', `  class ${cyclicIds.join(',')} cycle`];
  }

  /** Mermaid node ids must be alphanumeric/underscore; node ids here are file paths. */
  private buildIdMap(nodes: DiagramNode[]): Map<string, string> {
    const idFor = new Map<string, string>();
    const used = new Set<string>();
    nodes.forEach((node, index) => {
      let safe = node.id.replace(/[^a-zA-Z0-9]/g, '_');
      if (/^[0-9]/.test(safe)) {
        safe = `n_${safe}`;
      }
      if (used.has(safe)) {
        safe = `${safe}_${index}`;
      }
      used.add(safe);
      idFor.set(node.id, safe);
    });
    return idFor;
  }

  private escapeLabel(label: string): string {
    return label.replace(/"/g, "'");
  }
}
