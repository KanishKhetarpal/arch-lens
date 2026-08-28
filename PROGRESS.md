# Progress

Roadmap for arch-lens, tracked as small conventional-commit-sized steps.
Checked items are done; the rest are up next, in order.

## Phase 1 — Scaffold

- [x] chore: initialize NestJS project (package.json, tsconfig.json, nest-cli.json, src/main.ts)
- [x] chore: add ESLint, Prettier, .editorconfig, .gitignore
- [x] docs: README with vision, feature list, architecture overview
- [x] feat: AppModule + health controller
- [x] feat(config): typed config module with env schema validation
- [x] test: jest unit + e2e harness with one passing test

## Phase 2 — Ingestion

- [x] feat(ingestion): RepoSource DTO + reader interfaces
- [x] feat(ingestion): local filesystem repo reader
- [x] feat(ingestion): git URL cloner (simple-git)
- [x] feat(ingestion): source-file enumerator with ignore rules
- [x] test(ingestion): enumerator unit tests with fixtures
- [x] docs: ingestion module notes

## Phase 3 — Parser

- [x] feat(parser): ts-morph project loader
- [x] feat(parser): extract import/export declarations
- [x] feat(parser): extract classes, functions, Nest decorators
- [x] feat(parser): normalize into ModuleSymbol model
- [x] test(parser): parsing tests on sample fixtures
- [x] docs: parser module notes

## Phase 4 — Dependency Graph

- [x] feat(graph): graph data structure (nodes/edges)
- [x] feat(graph): build edges from import relations
- [x] feat(graph): cycle detection (Tarjan SCC)
- [x] feat(graph): topological layering / grouping
- [x] feat(graph): metrics — fan-in/fan-out, coupling, instability
- [x] test(graph): graph + cycle tests

## Phase 5 — Data Flow

- [x] feat(dataflow): DI injection graph from constructor params
- [x] feat(dataflow): trace controller -> service -> repository flows
- [x] feat(dataflow): annotate edges with data/DTO types
- [x] feat(dataflow): merge data-flow into dependency graph
- [x] test(dataflow): flow inference tests
- [x] docs: dataflow module notes

## Phase 6 — Diagram

- [x] feat(diagram): graph -> Mermaid renderer
- [x] feat(diagram): graph -> D3 JSON exporter
- [x] feat(diagram): interactive HTML/SVG output (zoom, hover, highlight)
- [x] feat(diagram): theming + layout options
- [x] test(diagram): renderer snapshot tests
- [x] docs: diagram module notes

## Phase 7 — Explanation

- [x] feat(explain): template-based per-module summaries
- [x] feat(explain): describe layers, entrypoints, boundaries
- [x] feat(explain): highlight cycles + coupling hotspots
- [x] feat(explain): LLM-ready prompt builder (pluggable provider)
- [x] test(explain): explanation tests
- [x] docs: explanation module notes

## Phase 8 — API + CLI

- [ ] feat(api): POST /analyze (repo path or git URL)
- [ ] feat(api): GET /diagram/:id and GET /explanation/:id
- [ ] feat(api): async job handling + status endpoint
- [ ] feat(cli): arch-lens analyze <path> command
- [ ] test(api): e2e tests
- [ ] docs: usage examples + API reference in README

## Phase 9+ — Polish

Repeat/extend once Phase 8 is done: result caching, GitHub Action wrapper,
sample gallery, docs site, multi-language parsing (Python/Go), Docker image,
CI workflow, CONTRIBUTING + issue templates.
