import { Module } from '@nestjs/common';
import { ExplanationBuilder } from './builder/explanation-builder';
import { HotspotDetector } from './hotspots/hotspot-detector';
import { ArchitectureOverviewBuilder } from './overview/architecture-overview-builder';
import { ExplanationPromptBuilder } from './prompt/explanation-prompt-builder';
import { ModuleSummarizer } from './summary/module-summarizer';

@Module({
  providers: [
    ModuleSummarizer,
    ArchitectureOverviewBuilder,
    HotspotDetector,
    ExplanationPromptBuilder,
    ExplanationBuilder,
  ],
  exports: [
    ModuleSummarizer,
    ArchitectureOverviewBuilder,
    HotspotDetector,
    ExplanationPromptBuilder,
    ExplanationBuilder,
  ],
})
export class ExplainModule {}
