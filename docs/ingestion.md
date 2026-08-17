# Ingestion

The ingestion module (`src/ingestion`) turns a `RepoSource` — a local path or
a git URL — into a list of source files ready for the parser (Phase 3).

## Flow

1. **`RepoSourceDto` → `RepoSource`** (`dto/repo-source.dto.ts`,
   `models/repo-source.model.ts`): the wire-facing DTO (`type`, `path`,
   `url`, `ref`) is validated and narrowed by `toRepoSource()` into a
   discriminated union, `LocalRepoSource | GitRepoSource`.
2. **`RepoReader.resolve(source)`** (`interfaces/repo-reader.interface.ts`):
   turns a `RepoSource` into a `ResolvedRepo` — an absolute `rootPath` on
   local disk plus a `cleanup()` to release any temp resources. Two
   implementations:
   - `FilesystemRepoReader` — resolves a local path, checking it exists and
     is a directory. `cleanup()` is a no-op since the caller owns the path.
   - `GitRepoReader` — shallow-clones (`--depth 1`) a remote URL into a
     temp directory via `simple-git`, optionally pinned to `ref` with
     `--single-branch`. `cleanup()` removes the clone.
3. **`SourceFileEnumerator.enumerate(rootPath, options?)`**
   (`enumeration/source-file-enumerator.ts`): walks the resolved root and
   returns `SourceFile[]` (`absolutePath`, `relativePath`, `extension`),
   sorted by relative path. Default rules (`enumeration/ignore-rules.ts`):
   - extensions: `.ts`, `.tsx`, `.js`, `.jsx`
   - ignored directories: `node_modules`, `.git`, `dist`, `build`, `out`,
     `coverage`, `.next`, `.nuxt`, `.turbo`, `.cache`
   - ignored files: `*.d.ts` (glob-lite — only a leading `*` wildcard is
     supported)

   All three lists are overridable per call via `EnumerateSourceFilesOptions`.

## Why a `RepoReader` interface instead of one reader

Local paths need no I/O beyond a stat check; git URLs need a clone and a
temp-dir cleanup. Splitting them keeps each reader's failure modes
(missing directory vs. clone failure) simple to reason about, while the
shared `ResolvedRepo` shape lets the rest of the pipeline stay ignorant of
which source kind it got.

## Not yet wired up

`IngestionModule` currently only registers the readers and enumerator as
providers. Routing a `RepoSource` to the right reader and orchestrating
resolve → enumerate → `cleanup()` is deferred to the API layer (Phase 8),
once there's a real caller (`POST /analyze`) to drive it.
