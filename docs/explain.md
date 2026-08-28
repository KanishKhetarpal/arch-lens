# Explanation

The explain module (`src/explain`) turns a `DiagramModel` (Phase 6) and its
source `DataFlowGraph` (Phase 5) into an `Explanation` — structured,
template-generated facts about the codebase plus a single LLM-ready prompt
built from them.

## Flow

1. **`ModuleSummarizer.summarize(model, injection)`**
   (`summary/module-summarizer.ts`): builds one `ModuleSummary` per
   `DiagramModel` node — the architectural layer(s) declared in that file
   (read off the DI injection graph's `DiNode.relativePath`), its metrics,
   cycle membership, dependents/dependencies (from the diagram edges), and
   the Dto types it carries — folded into a plain-English `sentence`.
2. **`ArchitectureOverviewBuilder.build(model, flow)`**
   (`overview/architecture-overview-builder.ts`): counts DI nodes per
   layer, walks every controller's traced `FlowChain`s (Phase 5) to report
   its longest chain and whether it ever reaches a repository, and reads
   the DI edges to describe layer-to-layer call boundaries (e.g.
   "Controller modules depend on service modules.").
3. **`HotspotDetector.detect(model, options?)`** (`hotspots/hotspot-detector.ts`):
   surfaces Phase 4's non-trivial strongly connected components as
   `CycleHotspot`s, and flags nodes whose `fanIn + fanOut` crosses a
   `minCoupling` threshold (default 3) as `CouplingHotspot`s, classified as
   `fan-in-magnet` (change-risk — many things depend on it), `fan-out-heavy`
   (fragile — depends on many things), or `balanced`.
4. **`ExplanationPromptBuilder.build(overview, summaries, hotspots)`**
   (`prompt/explanation-prompt-builder.ts`): renders the three pieces above
   into one markdown prompt with `## Overview` / `## Entrypoints` /
   `## Modules` / `## Hotspots` sections, instructing an LLM to write a
   plain-English narrative from only those facts. `generate(provider, prompt)`
   hands that prompt to a pluggable `LlmProvider` (`interfaces/llm-provider.interface.ts`)
   — arch-lens defines the seam but ships no concrete implementation or API keys.
5. **`ExplanationBuilder.build(model, flow)`** (`builder/explanation-builder.ts`):
   composes the four pieces above into one `Explanation`.

## Why template-based, not LLM-generated, by default

`ModuleSummary.sentence`, `ArchitectureOverview.narrative`, and every
hotspot `description` are assembled from fixed English templates over
structured data — no model call required to get *a* readable explanation.
The `LlmProvider` seam exists for callers who want a model to turn the same
structured facts into richer prose, but the templated output has to stand
on its own first: it's what `ExplanationPromptBuilder` itself feeds the
model as ground truth, so an LLM only elaborates on facts already known to
be correct rather than inventing them.

## Not yet wired up

`ExplainModule` registers the summarizer, overview builder, hotspot
detector, prompt builder, and `ExplanationBuilder` as providers but isn't
imported into `AppModule` yet — same deferral as `ParserModule`,
`GraphModule`, `DataFlowModule`, and `DiagramModule`, until the API layer
(Phase 8) has a real caller to run ingestion → parser → graph → data flow
→ diagram → explanation end to end.
