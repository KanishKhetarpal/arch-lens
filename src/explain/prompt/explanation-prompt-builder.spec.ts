import { ArchitectureOverview } from '../interfaces/architecture-overview.interface';
import { HotspotReport } from '../interfaces/hotspot.interface';
import { LlmProvider } from '../interfaces/llm-provider.interface';
import { ModuleSummary } from '../interfaces/module-summary.interface';
import { ExplanationPromptBuilder } from './explanation-prompt-builder';

describe('ExplanationPromptBuilder', () => {
  let builder: ExplanationPromptBuilder;

  const overview: ArchitectureOverview = {
    moduleCount: 1,
    layerCounts: { controller: 1, service: 0, repository: 0, other: 0 },
    entrypoints: [
      {
        controllerId: 'cats.controller.ts#CatsController',
        relativePath: 'cats.controller.ts',
        className: 'CatsController',
        reachesRepository: false,
        longestChain: ['CatsController'],
      },
    ],
    boundaries: ['Controller modules depend on service modules.'],
    narrative: 'The codebase has 1 module across 1 dependency layer.',
  };

  const summaries: ModuleSummary[] = [
    {
      id: 'cats.controller.ts',
      label: 'cats.controller.ts',
      layers: ['controller'],
      metrics: { nodeId: 'cats.controller.ts', fanIn: 0, fanOut: 0, coupling: 0, instability: 0 },
      inCycle: false,
      dependsOn: [],
      dependedOnBy: [],
      dataTypes: [],
      sentence: 'cats.controller.ts is a controller module.',
    },
  ];

  const hotspots: HotspotReport = {
    cycles: [{ cycleId: 0, nodeIds: ['a.ts', 'b.ts'], description: 'a.ts and b.ts form a cycle.' }],
    coupling: [],
  };

  beforeEach(() => {
    builder = new ExplanationPromptBuilder();
  });

  it('renders overview, entrypoints, modules, and hotspots as markdown sections', () => {
    const prompt = builder.build(overview, summaries, hotspots);

    expect(prompt).toContain('# Architecture Explanation Request');
    expect(prompt).toContain('## Overview');
    expect(prompt).toContain('The codebase has 1 module across 1 dependency layer.');
    expect(prompt).toContain('Controller modules depend on service modules.');
    expect(prompt).toContain('## Entrypoints');
    expect(prompt).toContain(
      '- CatsController (cats.controller.ts): never reaches a repository via CatsController',
    );
    expect(prompt).toContain('## Modules');
    expect(prompt).toContain('- cats.controller.ts is a controller module.');
    expect(prompt).toContain('## Hotspots');
    expect(prompt).toContain('- a.ts and b.ts form a cycle.');
  });

  it('renders "none" placeholders for empty sections', () => {
    const emptyOverview: ArchitectureOverview = { ...overview, entrypoints: [], boundaries: [] };
    const emptyHotspots: HotspotReport = { cycles: [], coupling: [] };

    const prompt = builder.build(emptyOverview, [], emptyHotspots);

    const entrypointsSection = prompt.split('## Entrypoints')[1].split('## Modules')[0];
    const modulesSection = prompt.split('## Modules')[1].split('## Hotspots')[0];
    const hotspotsSection = prompt.split('## Hotspots')[1];

    expect(entrypointsSection).toContain('- none');
    expect(modulesSection).toContain('- none');
    expect(hotspotsSection).toContain('- none');
  });

  it('delegates prompt completion to the supplied provider', async () => {
    const provider: LlmProvider = { name: 'stub', complete: jest.fn().mockResolvedValue('done') };

    const result = await builder.generate(provider, 'a prompt');

    expect(provider.complete).toHaveBeenCalledWith('a prompt');
    expect(result).toBe('done');
  });
});
