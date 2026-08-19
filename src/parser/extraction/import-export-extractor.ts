import { Injectable } from '@nestjs/common';
import { SourceFile as TsMorphSourceFile } from 'ts-morph';
import { ExportDeclarationInfo } from '../interfaces/export-declaration.interface';
import { ImportDeclarationInfo } from '../interfaces/import-declaration.interface';

@Injectable()
export class ImportExportExtractor {
  extractImports(sourceFile: TsMorphSourceFile): ImportDeclarationInfo[] {
    return sourceFile.getImportDeclarations().map((decl) => {
      const bindings: ImportDeclarationInfo['bindings'] = [];

      const defaultImport = decl.getDefaultImport();
      if (defaultImport) {
        bindings.push({ name: defaultImport.getText(), kind: 'default' });
      }

      const namespaceImport = decl.getNamespaceImport();
      if (namespaceImport) {
        bindings.push({ name: namespaceImport.getText(), kind: 'namespace' });
      }

      for (const specifier of decl.getNamedImports()) {
        const importedName = specifier.getName();
        const localName = specifier.getAliasNode()?.getText() ?? importedName;
        bindings.push({ name: localName, importedName, kind: 'named' });
      }

      return {
        moduleSpecifier: decl.getModuleSpecifierValue(),
        isRelative: decl.isModuleSpecifierRelative(),
        bindings,
        isTypeOnly: decl.isTypeOnly(),
      };
    });
  }

  extractExports(sourceFile: TsMorphSourceFile): ExportDeclarationInfo[] {
    const results: ExportDeclarationInfo[] = [];

    for (const decl of sourceFile.getExportDeclarations()) {
      results.push({
        moduleSpecifier: decl.getModuleSpecifierValue(),
        isWildcard: decl.isNamespaceExport(),
        wildcardAlias: decl.getNamespaceExport()?.getName(),
        bindings: decl.getNamedExports().map((specifier) => ({
          name: specifier.getName(),
          alias: specifier.getAliasNode()?.getText(),
        })),
        isTypeOnly: decl.isTypeOnly(),
        isDefaultExpression: false,
      });
    }

    for (const assignment of sourceFile.getExportAssignments()) {
      if (assignment.isExportEquals()) {
        continue;
      }
      results.push({
        isWildcard: false,
        bindings: [],
        isTypeOnly: false,
        isDefaultExpression: true,
      });
    }

    return results;
  }
}
