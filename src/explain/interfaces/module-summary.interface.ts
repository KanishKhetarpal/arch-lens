import { ArchitecturalLayer } from '../../dataflow/interfaces/di-graph.interface';
import { NodeMetrics } from '../../graph/interfaces/node-metrics.interface';

/** Plain-English, template-generated summary of a single module (file). */
export interface ModuleSummary {
  /** relativePath — matches DiagramNode.id. */
  id: string;
  label: string;
  /** Architectural layers of the DI classes declared in this file, if any. */
  layers: ArchitecturalLayer[];
  metrics: NodeMetrics;
  inCycle: boolean;
  /** relativePaths this module imports. */
  dependsOn: string[];
  /** relativePaths that import this module. */
  dependedOnBy: string[];
  /** Dto-suffixed type names carried across this module's outgoing edges. */
  dataTypes: string[];
  sentence: string;
}
