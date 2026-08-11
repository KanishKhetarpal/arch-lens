# arch-lens

**arch-lens** turns a codebase into an architecture diagram and a plain-English
explanation of how it's put together. Point it at a local folder or a git URL;
it parses the AST, infers module dependencies and data flow, and gives you back
something you can actually show a teammate or a new hire.

## Why

Reading a new codebase usually means opening a dozen files and mentally
stitching together the dependency graph yourself. arch-lens automates that
first pass: it builds the graph from the source, renders it, and describes it
in words, so the "how does this thing work" ramp-up starts from a diagram
instead of a blank editor.

## What it does

- **Ingests** a repo — local path or a git URL (cloned on the fly).
- **Parses** the TypeScript AST (via [ts-morph](https://ts-morph.com/)) to
  extract modules, classes, imports/exports, and Nest-specific decorators
  (`@Module`, `@Injectable`, `@Controller`, etc).
- **Builds a dependency graph** of modules and services, with cycle detection
  and basic coupling/instability metrics.
- **Infers data flow** by following constructor-injected dependencies from
  controllers down through services to repositories/data sources.
- **Renders diagrams** — Mermaid for docs/markdown, and an interactive
  HTML/SVG view with zoom, hover, and highlighting for exploring larger graphs.
- **Explains itself** — template-based summaries of each module's role, the
  layers/boundaries in the app, and any cycles or hotspots worth knowing about.

## Architecture overview

arch-lens is a NestJS application, organized as a pipeline of modules that
mirror the stages above:

```
ingestion  -> parser -> graph -> dataflow -> diagram
                                      \-> explain
```

- **ingestion** — reads a repo (filesystem or cloned git URL) into a flat list
  of source files, respecting ignore rules (`.gitignore`-style).
- **parser** — loads those files into a ts-morph `Project` and normalizes each
  file into a `ModuleSymbol`: its imports, exports, classes, and decorators.
- **graph** — turns `ModuleSymbol`s into a directed graph (nodes + edges),
  detects cycles (Tarjan's SCC algorithm), and computes fan-in/fan-out and
  instability metrics per node.
- **dataflow** — layers a second graph on top, built from constructor
  injection, tracing typical `controller -> service -> repository` chains and
  annotating edges with the DTO/entity types that flow across them.
- **diagram** — exports the merged graph as Mermaid source, a D3-friendly JSON
  document, or a self-contained interactive HTML page.
- **explain** — turns the graph and its metrics into plain-English summaries,
  and exposes a prompt builder so an LLM provider can be plugged in for richer
  explanations.

Everything is exposed over a small HTTP API (`POST /analyze`, `GET
/diagram/:id`, `GET /explanation/:id`) and a CLI (`arch-lens analyze <path>`)
that both drive the same pipeline.

## Status

Early and under active daily development — see [PROGRESS.md](./PROGRESS.md)
for the current roadmap and what's implemented so far.

## Tech stack

NestJS, TypeScript, ts-morph, simple-git.

## Getting started

```bash
npm install
npm run start:dev
```

## Testing

```bash
npm test        # unit tests
npm run test:e2e   # end-to-end tests
```
