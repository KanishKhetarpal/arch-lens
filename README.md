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

## API reference

Analysis runs as a background job: `POST /analyze` kicks it off and returns a
job id immediately; poll `GET /analyze/:id` for status, then fetch the
diagram or explanation once it's `completed`.

### `POST /analyze`

Body is a repo source — either a local path or a git URL:

```bash
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{"type": "local", "path": "/path/to/repo"}'

curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{"type": "git", "url": "https://github.com/nestjs/nest", "ref": "master"}'
```

```json
{ "id": "9d0a9416-...", "status": "pending", "createdAt": "2026-08-29T14:30:19.254Z" }
```

Repeat requests for the same local path or git `url`+`ref` are served from an
in-memory cache (TTL set by `ANALYSIS_CACHE_TTL_SECONDS`, default 300s) and
resolve immediately with `"status": "completed", "fromCache": true`. Set
`"noCache": true` in the body to force a fresh run.

### `GET /analyze/:id`

Returns the job's current status (`pending` | `running` | `completed` |
`failed`), plus `completedAt`, `error`, and `fromCache` once it settles.

### `GET /diagram/:id?format=mermaid|html|json`

Only valid once the job is `completed` (409 otherwise). `format` defaults to
`mermaid`:

- `mermaid` — Mermaid `flowchart` source (`text/plain`), pastable into docs.
- `html` — a self-contained interactive HTML/SVG page (`text/html`) with
  pan/zoom/hover/click highlighting.
- `json` — the D3-friendly `{ nodes, links }` export (`application/json`).

### `GET /explanation/:id`

Returns the full `Explanation` object once the job is `completed`: per-module
summaries, the architecture overview, cycle/coupling hotspots, and an
LLM-ready prompt built from all three.

## CLI

```bash
npm run build
node dist/cli/main-cli.js analyze <path-or-git-url> [--out <dir>] [--ref <branch>]
# or, once installed as a package: arch-lens analyze <path-or-git-url>
```

Runs the same pipeline as the API, outside of a running server, and writes
`diagram.mmd`, `diagram.html`, `diagram.json`, and `explanation.md` into
`--out` (default `./arch-lens-out`). A target starting with `http(s)://` or
`git@`, or ending in `.git`, is treated as a git URL; anything else is a
local path.

```bash
node dist/cli/main-cli.js analyze ./my-repo --out ./my-repo-arch-lens
node dist/cli/main-cli.js analyze https://github.com/nestjs/nest --ref master
```

## Testing

```bash
npm test        # unit tests
npm run test:e2e   # end-to-end tests
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the development workflow and
project structure.

## License

[MIT](./LICENSE)
