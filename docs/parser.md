# Parser

The parser module (`src/parser`) turns the `SourceFile[]` produced by
ingestion (Phase 2) into `ModuleSymbol[]` — a normalized, syntactic view of
each file's imports, exports, classes, and functions, ready for the
dependency graph (Phase 4).

## Flow

1. **`TsMorphProjectLoader.load(files)`** (`project/ts-morph-project-loader.ts`):
   builds an in-memory ts-morph `Project` containing exactly the given
   files. `skipFileDependencyResolution` is on, so ts-morph never walks off
   to add imported files or resolve the target repo's own `tsconfig.json` —
   parsing stays syntactic, fast, and independent of whether the target
   repo even builds. `loadFile(file)` is a convenience for the common
   single-file case.
2. **`ImportExportExtractor`** (`extraction/import-export-extractor.ts`):
   - `extractImports(sourceFile)` reads each `ImportDeclaration` into an
     `ImportDeclarationInfo` — module specifier, whether it's relative, and
     a flat list of `ImportedBinding`s (`default` / `namespace` / `named`,
     with the original name preserved separately from a local alias).
   - `extractExports(sourceFile)` reads `ExportDeclaration` nodes
     (`export { X } from './y'`, `export * from './y'`, `export * as ns
     from './y'`) into `ExportDeclarationInfo`, plus bare `export default
     <expr>` assignments as a `isDefaultExpression: true` entry. Exports
     via `export class X` / `export default class X` are *not* duplicated
     here — see the next extractor.
3. **`NestDeclarationExtractor`** (`extraction/nest-declaration-extractor.ts`):
   - `extractClasses(sourceFile)` reads each class into a
     `ClassDeclarationInfo`: name (`"(default)"` for an anonymous default
     export), `isExported`/`isDefaultExport`, class-level decorators
     (`@Injectable()`, `@Controller('cats')`, ...) with their raw argument
     text, the first constructor's parameters (name, type text, and any
     parameter decorators — the seed for Phase 5's DI graph), and method
     names.
   - `extractFunctions(sourceFile)` reads top-level function declarations
     (name, `isExported`, `isDefaultExport`, `isAsync`).
4. **`ModuleSymbolNormalizer.normalize(files)`**
   (`normalization/module-symbol-normalizer.ts`): loads all `files` into
   one `TsMorphProjectLoader` project, then runs both extractors per file
   and assembles a `ModuleSymbol` (`interfaces/module-symbol.interface.ts`)
   — `relativePath` plus `imports`, `exports`, `classes`, `functions` —
   keyed the same way as ingestion's `SourceFile.relativePath` so the two
   line up directly.

## Why syntactic, not type-checked

`getTypeNode()?.getText()` is used for constructor parameter types instead
of `getType().getText()`. The former reads the type annotation as written;
the latter invokes the TypeScript checker, which — combined with
`skipFileDependencyResolution` — would try to resolve types across files
we deliberately didn't load, and slow parsing down for no benefit at this
stage. Anything that needs real type resolution belongs in a later phase
once there's a concrete need for it.

## Not yet wired up

`ParserModule` registers the loader, both extractors, and the normalizer
as providers but isn't imported into `AppModule` yet — same deferral as
`IngestionModule`, until the API layer (Phase 8) has a real caller to run
ingestion → parser → graph end to end.
