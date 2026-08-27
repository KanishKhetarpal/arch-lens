# Diagram

The diagram module (`src/diagram`) turns a `DataFlowGraph` (Phase 5) into
renderable output: a `DiagramModel` that resolves layering, cycle, and
metrics analysis onto each node/edge once, plus three renderers that
consume it — Mermaid text, a D3-shaped JSON export, and a self-contained
interactive HTML/SVG page.

## Flow

1. **`DiagramModelBuilder.build(dataFlowGraph)`**
   (`builder/diagram-model-builder.ts`): runs `GraphLayering`,
   `CycleDetector`, and `GraphMetrics` (Phase 4) once against the graph and
   folds the results onto each node/edge into a `DiagramModel`
   (`interfaces/diagram-model.interface.ts`) — `layerDepth` and `cycleId`
   per node, `dataTypes` (Phase 5) and a `cyclic` flag per edge (true when
   both endpoints share a `cycleId`). Every renderer below reads this
   shape instead of repeating the analysis.
2. **`MermaidRenderer.render(model, options?)`** (`renderers/mermaid-renderer.ts`):
   emits a Mermaid `flowchart` definition — nodes grouped into `subgraph`s
   by layer depth (toggle with `groupByLayer: false`), edges labelled with
   their carried Dto types, cyclic nodes tagged via a `classDef`, and a
   `TD`/`LR` `direction` option. Node ids are file paths, so they're
   sanitized into Mermaid-safe identifiers (`buildIdMap`) before use.
3. **`D3JsonExporter.export(model)`** (`renderers/d3-json-exporter.ts`):
   flattens the model into a plain `{ nodes, links }` shape matching what
   D3's force/hierarchy layouts expect client-side (`source`/`target`
   instead of `from`/`to`), carrying layer/cycle/metrics fields for
   client-side styling.
4. **`LayeredLayout.compute(model, options?)`** (`layout/layered-layout.ts`):
   places each node at `(position within layer, layer depth)`, honoring a
   `direction` (`vertical`/`horizontal`, swaps which axis layers stack
   along) and `nodeSpacing`/`layerSpacing` overrides. Deterministic —
   same model in, same positions out — since it only reads the layering
   already resolved onto `DiagramModel.layers`.
5. **`HtmlDiagramRenderer.render(model, options?)`**
   (`renderers/html-diagram-renderer.ts`): renders `LayeredLayout`'s
   positions into a single self-contained HTML document — inline SVG
   nodes/edges plus a dependency-free vanilla-JS script for pan (drag),
   zoom (wheel), and hover/click highlighting of a node's neighborhood
   with a metrics tooltip (fan-in/out, instability, cycle membership). A
   `DiagramTheme` (`interfaces/diagram-theme.interface.ts`; `DARK_THEME`
   default, `LIGHT_THEME` provided) drives every color in the generated
   stylesheet; `options.layout` forwards straight through to
   `LayeredLayout`.

## Why no D3/CDN dependency

The HTML renderer hand-rolls pan/zoom/highlight in ~80 lines of vanilla JS
instead of shipping a D3 bundle or `<script src="cdn...">` tag. The output
is meant to be a single file that opens directly in a browser, offline,
without a build step or network access — a hard requirement a CDN
`<script>` tag would break. `D3JsonExporter` still exists for callers who
*do* want to feed the graph into their own D3 (or other) visualization.

## Untrusted input into the HTML output

Node labels and Dto type names originate from the analyzed repo's own
source (class names, file names) — not from arch-lens itself — so
`HtmlDiagramRenderer` treats them as untrusted: SVG text/attributes go
through `escapeText`/`escapeAttr`, and the embedded `graph-metadata` JSON
blob has every angle bracket replaced with its `\uXXXX` unicode escape
before being embedded, so a label containing a literal closing script
tag can't break out of the enclosing metadata `<script>` element.

## Not yet wired up

`DiagramModule` registers the builder and all three renderers as
providers but isn't imported into `AppModule` yet — same deferral as
`ParserModule`, `GraphModule`, and `DataFlowModule`, until the API layer
(Phase 8) has a real caller to run ingestion → parser → graph → data flow
→ diagram end to end.
