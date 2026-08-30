# Contributing to arch-lens

## Getting set up

```bash
npm install
npm run start:dev   # http://localhost:3000
```

## Development workflow

```bash
npm run lint        # eslint --fix
npm test            # unit tests (src/**/*.spec.ts)
npm run test:e2e    # end-to-end tests (test/**/*.e2e-spec.ts)
npm run build        # nest build -> dist/
```

All four must pass before opening a PR; CI runs the same checks on every
push and pull request against `main`.

## Project structure

Each pipeline stage is its own Nest module under `src/`, in the order the
analysis pipeline runs: `ingestion` -> `parser` -> `graph` -> `dataflow` ->
`diagram` -> `explain`, orchestrated by `analysis/analysis.service.ts` and
exposed via `api/` (HTTP) and `cli/` (the `arch-lens` binary). See
[PROGRESS.md](./PROGRESS.md) for the roadmap and what's implemented so far.

## Commit messages

This repo uses [Conventional Commits](https://www.conventionalcommits.org/)
(`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `ci:`, ...), one logical change
per commit.

## Tests

New behavior should come with unit tests colocated with the module
(`*.spec.ts` next to the file it tests) and, for API/CLI-facing changes, an
e2e test under `test/`. Parser/graph/diagram tests generally run against
fixtures under each module's `__fixtures__/` directory — prefer extending an
existing fixture over inventing a new one.

## Reporting issues

Use the bug report or feature request templates when opening an issue —
they ask for the information that's fastest for us to act on.
