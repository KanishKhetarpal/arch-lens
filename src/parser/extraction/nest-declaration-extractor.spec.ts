import { join } from 'node:path';
import { NestDeclarationExtractor } from './nest-declaration-extractor';
import { TsMorphProjectLoader } from '../project/ts-morph-project-loader';

describe('NestDeclarationExtractor', () => {
  const fixtureRoot = join(__dirname, '..', '__fixtures__', 'sample-project');
  const loader = new TsMorphProjectLoader();
  let extractor: NestDeclarationExtractor;

  beforeEach(() => {
    extractor = new NestDeclarationExtractor();
  });

  function loadFixture(relativePath: string) {
    return loader.loadFile({
      absolutePath: join(fixtureRoot, relativePath),
      relativePath,
      extension: '.ts',
    });
  }

  describe('extractClasses', () => {
    it('extracts a decorated controller with a decorated constructor param', () => {
      const sourceFile = loadFixture('cats.controller.ts');
      const [controller] = extractor.extractClasses(sourceFile);

      expect(controller.name).toBe('CatsController');
      expect(controller.isExported).toBe(true);
      expect(controller.isDefaultExport).toBe(false);
      expect(controller.decorators).toEqual([{ name: 'Controller', arguments: ["'cats'"] }]);
      expect(controller.constructorParams).toEqual([
        { name: 'catsService', typeName: 'CatsService', decorators: [] },
      ]);
      expect(controller.methodNames).toEqual(['create', 'findAll']);
    });

    it('extracts an @Injectable service with no constructor', () => {
      const sourceFile = loadFixture('cats.service.ts');
      const [service] = extractor.extractClasses(sourceFile);

      expect(service.name).toBe('CatsService');
      expect(service.decorators).toEqual([{ name: 'Injectable', arguments: [] }]);
      expect(service.constructorParams).toEqual([]);
    });

    it('marks a named default-exported class accordingly', () => {
      const sourceFile = loadFixture('utils/logger.ts');
      const [logger] = extractor.extractClasses(sourceFile);

      expect(logger.name).toBe('Logger');
      expect(logger.isDefaultExport).toBe(true);
      expect(logger.isExported).toBe(true);
    });

    it('falls back to "(default)" for an anonymous default-exported class', () => {
      const sourceFile = loadFixture('utils/anonymous-default.ts');
      const [anon] = extractor.extractClasses(sourceFile);

      expect(anon.name).toBe('(default)');
      expect(anon.isDefaultExport).toBe(true);
      expect(anon.methodNames).toEqual(['ping']);
    });
  });

  describe('extractFunctions', () => {
    it('extracts exported, non-async functions', () => {
      const sourceFile = loadFixture('utils/math.ts');
      const functions = extractor.extractFunctions(sourceFile);

      expect(functions).toEqual([
        { name: 'add', isExported: true, isDefaultExport: false, isAsync: false },
        { name: 'subtract', isExported: true, isDefaultExport: false, isAsync: false },
      ]);
    });

    it('extracts an exported async function', () => {
      const sourceFile = loadFixture('utils/describe-cat.ts');
      const [describeCat] = extractor.extractFunctions(sourceFile);

      expect(describeCat).toEqual({
        name: 'describeCat',
        isExported: true,
        isDefaultExport: false,
        isAsync: true,
      });
    });
  });
});
