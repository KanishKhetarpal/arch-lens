import { Injectable } from '@nestjs/common';
import { ArchitecturalLayer, DiGraph } from '../../dataflow/interfaces/di-graph.interface';
import { DiagramModel, DiagramNode } from '../../diagram/interfaces/diagram-model.interface';
import { ModuleSummary } from '../interfaces/module-summary.interface';

@Injectable()
export class ModuleSummarizer {
  /**
   * Builds one template-generated ModuleSummary per DiagramModel node,
   * folding in the architectural layer(s) declared in that file (from the
   * DI injection graph) and its neighbors/carried Dto types (from the
   * diagram edges) so each summary stands on its own.
   */
  summarize(model: DiagramModel, injection: DiGraph): ModuleSummary[] {
    const layersByModule = new Map<string, Set<ArchitecturalLayer>>();
    for (const node of injection.nodes) {
      const layers = layersByModule.get(node.relativePath) ?? new Set<ArchitecturalLayer>();
      layers.add(node.layer);
      layersByModule.set(node.relativePath, layers);
    }

    const dependsOn = new Map<string, Set<string>>();
    const dependedOnBy = new Map<string, Set<string>>();
    const dataTypesByModule = new Map<string, Set<string>>();
    for (const edge of model.edges) {
      addTo(dependsOn, edge.from, edge.to);
      addTo(dependedOnBy, edge.to, edge.from);
      if (edge.dataTypes.length > 0) {
        const types = dataTypesByModule.get(edge.from) ?? new Set<string>();
        edge.dataTypes.forEach((dataType) => types.add(dataType));
        dataTypesByModule.set(edge.from, types);
      }
    }

    return model.nodes.map((node) => {
      const layers = Array.from(layersByModule.get(node.id) ?? []).sort();
      const dependsOnIds = Array.from(dependsOn.get(node.id) ?? []).sort();
      const dependedOnByIds = Array.from(dependedOnBy.get(node.id) ?? []).sort();
      const dataTypes = Array.from(dataTypesByModule.get(node.id) ?? []).sort();
      const inCycle = node.cycleId !== null;

      const summary: ModuleSummary = {
        id: node.id,
        label: node.label,
        layers,
        metrics: node.metrics,
        inCycle,
        dependsOn: dependsOnIds,
        dependedOnBy: dependedOnByIds,
        dataTypes,
        sentence: '',
      };
      summary.sentence = this.buildSentence(node, summary);
      return summary;
    });
  }

  private buildSentence(node: DiagramNode, summary: ModuleSummary): string {
    const role = summary.layers.length > 0 ? `${summary.layers.join('/')} module` : 'plain module';
    const parts = [`${node.label} is a ${role}.`];

    parts.push(
      summary.dependsOn.length > 0
        ? `It depends on ${pluralize(summary.dependsOn.length, 'module')} (${summary.dependsOn.join(', ')}).`
        : 'It has no internal dependencies.',
    );

    parts.push(
      summary.dependedOnBy.length > 0
        ? `It is depended on by ${pluralize(summary.dependedOnBy.length, 'module')} (${summary.dependedOnBy.join(', ')}).`
        : 'Nothing else in the codebase depends on it.',
    );

    if (summary.dataTypes.length > 0) {
      parts.push(`It carries ${summary.dataTypes.join(', ')} across its dependencies.`);
    }

    if (summary.inCycle) {
      parts.push('It participates in a dependency cycle.');
    }

    return parts.join(' ');
  }
}

function addTo(map: Map<string, Set<string>>, key: string, value: string): void {
  const set = map.get(key) ?? new Set<string>();
  set.add(value);
  map.set(key, set);
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}
