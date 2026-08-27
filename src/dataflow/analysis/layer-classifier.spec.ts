import { ClassDeclarationInfo } from '../../parser/interfaces/class-declaration.interface';
import { classifyLayer, isDiParticipant } from './layer-classifier';

describe('layer-classifier', () => {
  const classWith = (name: string, decoratorNames: string[]): ClassDeclarationInfo => ({
    name,
    isExported: true,
    isDefaultExport: false,
    decorators: decoratorNames.map((decoratorName) => ({ name: decoratorName, arguments: [] })),
    constructorParams: [],
    methodNames: [],
  });

  describe('isDiParticipant', () => {
    it('is true for classes with a non-@Module decorator', () => {
      expect(isDiParticipant(classWith('CatsController', ['Controller']))).toBe(true);
    });

    it('is false for undecorated classes', () => {
      expect(isDiParticipant(classWith('PlainUtil', []))).toBe(false);
    });

    it('is false for classes decorated only with @Module', () => {
      expect(isDiParticipant(classWith('CatsModule', ['Module']))).toBe(false);
    });
  });

  describe('classifyLayer', () => {
    it('classifies @Controller classes as controller', () => {
      expect(classifyLayer(classWith('CatsController', ['Controller']))).toBe('controller');
    });

    it('classifies Repository-suffixed classes as repository even when @Injectable', () => {
      expect(classifyLayer(classWith('CatsRepository', ['Injectable']))).toBe('repository');
    });

    it('classifies other @Injectable classes as service', () => {
      expect(classifyLayer(classWith('CatsService', ['Injectable']))).toBe('service');
    });

    it('classifies undecorated or unrecognized classes as other', () => {
      expect(classifyLayer(classWith('CatsUtil', []))).toBe('other');
    });
  });
});
