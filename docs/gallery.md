# Sample Gallery

The gallery module (`src/gallery`) runs the full analysis pipeline against a
curated set of small sample repos and produces a static, browsable page
linking to each one's diagram and explanation — a way to see what arch-lens
outputs without pointing it at a real codebase first.

## Flow

1. **`GALLERY_SAMPLES`** (`gallery-samples.ts`): the curated list. Each entry
   is a `{ id, name, description, path }` pointing at a small standalone
   project under `samples/<id>/` at the repo root. `samples/` is excluded
   from `tsconfig`/`tsconfig.build` so the sample projects aren't compiled
   into arch-lens's own `dist/` — they're input fixtures for the pipeline to
   analyze, not part of the app.
2. **`generate-gallery.ts`**: boots the same `AnalysisService` the CLI uses
   (`NestFactory.createApplicationContext(AppModule)`), runs
   `analysisService.analyze({ type: Local, path })` for each sample, and
   writes `diagram.mmd` / `diagram.html` / `diagram.json` / `explanation.md`
   into `<out-dir>/<sample-id>/`.
3. **`GalleryIndexBuilder.build(summaries)`** (`gallery-index-builder.ts`):
   a pure function — no Nest DI, no filesystem access — that turns each
   sample's name/description/module-count/cycle-count into an `index.html`
   card linking to its generated files. Kept pure so it's unit-testable
   without running the pipeline.

Run it with:

```bash
npm run build
npm run gallery              # writes to ./gallery-out
npm run gallery -- ./out-dir # or a custom directory
```

## Samples

- **`blog-api`** — a clean layered app (`Controller -> Service ->
  Repository`, `Posts` depending on `Users` to attach an author). No cycles;
  shows what arch-lens looks like on architecture that isn't in trouble.
- **`coupled-notifications`** — `NotificationsService` and
  `SubscriptionsService` inject each other via `forwardRef`, which is exactly
  the kind of circular dependency that pattern exists to work around. It
  produces both a service-level and a module-level import cycle, so the
  cycle detector (Phase 4) and hotspot explanations (Phase 7) both have
  something real to flag.

## Why generated output isn't committed

`gallery-out/` (like the CLI's `arch-lens-out/`) is gitignored — it's
deterministic output of the pipeline, regenerable with one command, and
would otherwise drift out of sync with the samples or the renderers that
produce it.
