import { ArchitectureOverview } from './architecture-overview.interface';
import { HotspotReport } from './hotspot.interface';
import { ModuleSummary } from './module-summary.interface';

/** Everything Phase 7 produces from a DiagramModel + DataFlowGraph. */
export interface Explanation {
  moduleSummaries: ModuleSummary[];
  overview: ArchitectureOverview;
  hotspots: HotspotReport;
  /** LLM-ready prompt built from the three fields above. */
  prompt: string;
}
