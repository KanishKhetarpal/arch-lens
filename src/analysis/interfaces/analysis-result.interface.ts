import { D3Graph } from '../../diagram/interfaces/d3-graph.interface';
import { DiagramModel } from '../../diagram/interfaces/diagram-model.interface';
import { Explanation } from '../../explain/interfaces/explanation.interface';

/** Everything the analysis pipeline produces for one repo, ready to serve or write to disk. */
export interface AnalysisResult {
  diagramModel: DiagramModel;
  explanation: Explanation;
  mermaid: string;
  html: string;
  d3Json: D3Graph;
}
