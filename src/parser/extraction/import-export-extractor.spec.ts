import { join } from 'node:path';
import { ImportExportExtractor } from './import-export-extractor';
import { TsMorphProjectLoader } from '../project/ts-morph-project-loader';

describe('ImportExportExtractor', () => {
  const fixtureRoot = join(__dirname, '..', '__fixtures__', 'sample-project');
  const loader = new TsMorphProjectLoader();
  let extractor: ImportExportExtractor;

  beforeEach(() => {
    extractor = new ImportExportExtractor();
  });

  function loadFixture(relativePath: string) {
    return loader.loadFile({
      absolutePath: join(fixtureRoot, relativePath),
      relativePath,
      extension: '.ts',
    });
  }

  describe('extractImports', () => {
    it('extracts named imports with their module specifier', () => {
      const sourceFile = loadFixture('cats.controller.ts');
      const imports = extractor.extractImports(sourceFile);

      const nestImport = imports.find((i) => i.moduleSpecifier === '@nestjs/common');
      expect(nestImport?.isRelative).toBe(false);
      expect(nestImport?.isTypeOnly).toBe(false);
      expect(nestImport?.bindings).toEqual(
        expect.arrayContaining([
          { name: 'Body', importedName: 'Body', kind: 'named' },
          { name: 'Controller', importedName: 'Controller', kind: 'named' },
          { name: 'Get', importedName: 'Get', kind: 'named' },
          { name: 'Post', importedName: 'Post', kind: 'named' },
        ]),
      );

      const serviceImport = imports.find((i) => i.moduleSpecifier === './cats.service');
      expect(serviceImport?.isRelative).toBe(true);
      expect(serviceImport?.bindings).toEqual([
        { name: 'CatsService', importedName: 'CatsService', kind: 'named' },
      ]);
    });

    it('extracts default, namespace, and type-only imports', () => {
      const sourceFile = loadFixture('utils/describe-cat.ts');
      const imports = extractor.extractImports(sourceFile);

      const loggerImport = imports.find((i) => i.moduleSpecifier === './logger');
      expect(loggerImport?.bindings).toEqual([{ name: 'Logger', kind: 'default' }]);

      const mathImport = imports.find((i) => i.moduleSpecifier === './math');
      expect(mathImport?.bindings).toEqual([{ name: 'MathUtils', kind: 'namespace' }]);

      const catImport = imports.find((i) => i.moduleSpecifier === '../interfaces/cat.interface');
      expect(catImport?.isTypeOnly).toBe(true);
      expect(catImport?.bindings).toEqual([{ name: 'Cat', importedName: 'Cat', kind: 'named' }]);
    });
  });

  describe('extractExports', () => {
    it('extracts named re-exports and a wildcard re-export', () => {
      const sourceFile = loadFixture('index.ts');
      const exports = extractor.extractExports(sourceFile);

      const moduleExport = exports.find((e) => e.moduleSpecifier === './cats.module');
      expect(moduleExport?.isWildcard).toBe(false);
      expect(moduleExport?.bindings).toEqual([{ name: 'CatsModule', alias: undefined }]);

      const wildcardExport = exports.find(
        (e) => e.moduleSpecifier === './interfaces/cat.interface',
      );
      expect(wildcardExport?.isWildcard).toBe(true);
      expect(wildcardExport?.bindings).toEqual([]);
    });

    it('extracts a bare "export default <expr>" as a default expression', () => {
      const sourceFile = loadFixture('utils/default-sum.ts');
      const exports = extractor.extractExports(sourceFile);

      expect(exports).toEqual([
        { isWildcard: false, bindings: [], isTypeOnly: false, isDefaultExpression: true },
      ]);
    });

    it('returns an empty array for a file with no export declarations', () => {
      const sourceFile = loadFixture('cats.service.ts');
      expect(extractor.extractExports(sourceFile)).toEqual([]);
    });
  });
});
