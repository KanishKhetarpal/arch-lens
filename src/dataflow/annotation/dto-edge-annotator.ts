import { Injectable } from '@nestjs/common';
import { DependencyGraph } from '../../graph/interfaces/graph.interface';
import { ModuleSymbol } from '../../parser/interfaces/module-symbol.interface';
import { DtoAnnotatedEdge } from '../interfaces/dto-annotated-edge.interface';

const DTO_NAME_PATTERN = /Dto$/;

@Injectable()
export class DtoEdgeAnnotator {
  /**
   * Tags each dependency-graph edge with the Dto-suffixed types it carries,
   * read off the importing module's own import bindings for that specifier
   * — e.g. `import { CreateCatDto } from './dto/create-cat.dto'` tags the
   * controller -> dto edge with `["CreateCatDto"]`. The parser doesn't
   * extract interfaces (only classes/functions), so this relies on the
   * `Dto` naming convention at the import site rather than the target
   * module's own declarations.
   */
  annotate(graph: DependencyGraph, symbols: ModuleSymbol[]): DtoAnnotatedEdge[] {
    const symbolByPath = new Map(symbols.map((symbol) => [symbol.relativePath, symbol]));

    return graph.edges.map((edge) => {
      const importDecl = symbolByPath
        .get(edge.from)
        ?.imports.find((importDeclaration) => importDeclaration.moduleSpecifier === edge.specifier);

      const dataTypes = (importDecl?.bindings ?? [])
        .map((binding) => binding.importedName ?? binding.name)
        .filter((name) => DTO_NAME_PATTERN.test(name));

      return { ...edge, dataTypes };
    });
  }
}
