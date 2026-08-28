import { Injectable } from '@nestjs/common';
import { DataFlowGraph } from '../../dataflow/interfaces/data-flow-graph.interface';
import { DiagramModel } from '../../diagram/interfaces/diagram-model.interface';
import { Explanation } from '../interfaces/explanation.interface';
import { HotspotDetector } from '../hotspots/hotspot-detector';
import { ArchitectureOverviewBuilder } from '../overview/architecture-overview-builder';
import { ExplanationPromptBuilder } from '../prompt/explanation-prompt-builder';
import { ModuleSummarizer } from '../summary/module-summarizer';

@Injectable()
export class ExplanationBuilder {
  constructor(
    private readonly moduleSummarizer: ModuleSummarizer,
    private readonly overviewBuilder: ArchitectureOverviewBuilder,
    private readonly hotspotDetector: HotspotDetector,
    private readonly promptBuilder: ExplanationPromptBuilder,
  ) {}

  /** Composes the module summaries, architecture overview, and hotspots into one Explanation, plus the LLM-ready prompt built from all three. */
  build(model: DiagramModel, flow: DataFlowGraph): Explanation {
    const moduleSummaries = this.moduleSummarizer.summarize(model, flow.injection);
    const overview = this.overviewBuilder.build(model, flow);
    const hotspots = this.hotspotDetector.detect(model);
    const prompt = this.promptBuilder.build(overview, moduleSummaries, hotspots);

    return { moduleSummaries, overview, hotspots, prompt };
  }
}
