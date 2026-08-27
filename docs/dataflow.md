# Data Flow

The data-flow module (`src/dataflow`) layers dependency-injection and
data-carrying information on top of the structural `DependencyGraph`
(Phase 4), producing a `DataFlowGraph` ready for the diagram (Phase 6).

## Flow

1. **`DiGraphBuilder.build(symbols)`** (`builder/di-graph-builder.ts`):
   builds a `DiGraph` — one `DiNode` per DI-participating class (any class
   with a decorator other than `@Module`; see `isDiParticipant` in
   `analysis/layer-classifier.ts`) and one `DiEdge` per constructor
   parameter whose type resolves to another node's class, either through a
   relative import (reusing `resolveModuleSpecifier` from the graph module)
   or a sibling class declared in the same file. Generic and array
   suffixes (`Repository<Cat>`, `Cat[]`) are stripped before matching.
   Parameters typed as primitives, external types, or anything that
   doesn't resolve to a parsed class produce no edge. `classifyLayer`
   assigns each node a `controller` / `service` / `repository` / `other`
   layer — `Repository`-suffixed classes are checked before `@Injectable`
   since a repository is an ordinary provider by decorator alone.
2. **`FlowTracer.trace(diGraph)`** (`analysis/flow-tracer.ts`): walks the
   `DiGraph` from every controller node, DFS-style, emitting one
   `FlowChain` per maximal path (branches produce multiple chains; a
   revisited node ends that branch instead of looping forever on a
   cycle). Each chain records `reachesRepository`, so a controller whose
   injected services never bottom out at a repository is easy to spot.
3. **`DtoEdgeAnnotator.annotate(graph, symbols)`**
   (`annotation/dto-edge-annotator.ts`): tags each `DependencyGraph` edge
   with the `Dto`-suffixed binding names imported across it (matched by
   `specifier` against the importing module's own `ImportDeclarationInfo`)
   into a `DtoAnnotatedEdge`. The parser only extracts classes and
   functions, not interfaces — most DTOs are plain interfaces — so this
   reads the naming convention at the import site rather than the
   target's declarations.
4. **`DataFlowGraphBuilder.build(symbols, dependencyGraph)`**
   (`builder/data-flow-graph-builder.ts`): composes the three pieces above
   into one `DataFlowGraph` — the dependency graph's nodes, its edges
   annotated with `dataTypes`, and the `injection` graph plus its `flows`
   riding alongside.

## Why layer classification needs more than the decorator

`@Injectable()` alone can't distinguish a service from a
TypeORM/Prisma-style repository — both use the same decorator. Checking
the `Repository` name suffix first is a pragmatic heuristic given the
parser is syntactic (Phase 3's "why syntactic, not type-checked" note
applies here too): no type checker means no way to see that a class
implements a repository interface or extends a repository base class,
so naming convention is what's available.

## Not yet wired up

`DataFlowModule` registers the builders, tracer, and annotator as
providers but isn't imported into `AppModule` yet — same deferral as
`ParserModule` and `GraphModule`, until the API layer (Phase 8) has a
real caller to run ingestion → parser → graph → data flow end to end.
