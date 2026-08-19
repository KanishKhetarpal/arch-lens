import { Injectable } from '@nestjs/common';
import { Decorator, SourceFile as TsMorphSourceFile } from 'ts-morph';
import { ClassDeclarationInfo, DecoratorInfo } from '../interfaces/class-declaration.interface';
import { FunctionDeclarationInfo } from '../interfaces/function-declaration.interface';

@Injectable()
export class NestDeclarationExtractor {
  extractClasses(sourceFile: TsMorphSourceFile): ClassDeclarationInfo[] {
    return sourceFile.getClasses().map((classDecl) => {
      const constructor = classDecl.getConstructors()[0];

      return {
        name: classDecl.getName() ?? '(default)',
        isExported: classDecl.isExported(),
        isDefaultExport: classDecl.isDefaultExport(),
        decorators: this.toDecoratorInfo(classDecl.getDecorators()),
        constructorParams: (constructor?.getParameters() ?? []).map((param) => ({
          name: param.getName(),
          typeName: param.getTypeNode()?.getText(),
          decorators: this.toDecoratorInfo(param.getDecorators()),
        })),
        methodNames: classDecl.getMethods().map((method) => method.getName()),
      };
    });
  }

  extractFunctions(sourceFile: TsMorphSourceFile): FunctionDeclarationInfo[] {
    return sourceFile.getFunctions().map((fn) => ({
      name: fn.getName() ?? '(default)',
      isExported: fn.isExported(),
      isDefaultExport: fn.isDefaultExport(),
      isAsync: fn.isAsync(),
    }));
  }

  private toDecoratorInfo(decorators: Decorator[]): DecoratorInfo[] {
    return decorators.map((decorator) => ({
      name: decorator.getName(),
      arguments: decorator.getArguments().map((arg) => arg.getText()),
    }));
  }
}
