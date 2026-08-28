import { Injectable } from '@nestjs/common';
import { ArchitectureOverview } from '../interfaces/architecture-overview.interface';
import { HotspotReport } from '../interfaces/hotspot.interface';
import { LlmProvider } from '../interfaces/llm-provider.interface';
import { ModuleSummary } from '../interfaces/module-summary.interface';

@Injectable()
export class ExplanationPromptBuilder {
  /**
   * Renders the overview, per-module summaries, and hotspots into a single
   * markdown prompt an LLM can turn into prose. Pure string assembly —
   * arch-lens never calls a model itself; `generate` below is the only
   * seam that does, and only when a caller supplies an `LlmProvider`.
   */
  build(
    overview: ArchitectureOverview,
    summaries: ModuleSummary[],
    hotspots: HotspotReport,
  ): string {
    const sections = [
      '# Architecture Explanation Request',
      '',
      'You are documenting the architecture of a codebase for a developer who ' +
        'has never seen it. Use only the structured facts below — do not invent ' +
        'modules, layers, or relationships that are not listed.',
      '',
      '## Overview',
      overview.narrative,
      ...(overview.boundaries.length > 0 ? [overview.boundaries.join(' ')] : []),
      '',
      '## Entrypoints',
      ...(overview.entrypoints.length > 0
        ? overview.entrypoints.map(
            (entrypoint) =>
              `- ${entrypoint.className} (${entrypoint.relativePath}): ${
                entrypoint.reachesRepository ? 'reaches a repository' : 'never reaches a repository'
              } via ${entrypoint.longestChain.join(' -> ')}`,
          )
        : ['- none']),
      '',
      '## Modules',
      ...(summaries.length > 0 ? summaries.map((summary) => `- ${summary.sentence}`) : ['- none']),
      '',
      '## Hotspots',
      ...(hotspots.cycles.length > 0 || hotspots.coupling.length > 0
        ? [
            ...hotspots.cycles.map((cycle) => `- ${cycle.description}`),
            ...hotspots.coupling.map((hotspot) => `- ${hotspot.description}`),
          ]
        : ['- none']),
      '',
      'Write a concise, plain-English explanation of this architecture: what it ' +
        'does, how data flows from entrypoints to storage, and what a new ' +
        'contributor should be careful of.',
    ];

    return sections.join('\n');
  }

  /** Hands a built prompt to a pluggable provider. arch-lens ships no concrete provider. */
  async generate(provider: LlmProvider, prompt: string): Promise<string> {
    return provider.complete(prompt);
  }
}
