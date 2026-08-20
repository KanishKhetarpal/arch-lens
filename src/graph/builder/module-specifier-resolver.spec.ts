import { candidateSpecifierPaths, resolveModuleSpecifier } from './module-specifier-resolver';

describe('resolveModuleSpecifier', () => {
  it('resolves a same-directory extensionless specifier to its .ts file', () => {
    const known = new Set(['cats.controller.ts', 'cats.service.ts']);
    expect(resolveModuleSpecifier('cats.controller.ts', './cats.service', known)).toBe(
      'cats.service.ts',
    );
  });

  it('resolves a specifier that climbs directories', () => {
    const known = new Set(['utils/describe-cat.ts', 'interfaces/cat.interface.ts']);
    expect(
      resolveModuleSpecifier('utils/describe-cat.ts', '../interfaces/cat.interface', known),
    ).toBe('interfaces/cat.interface.ts');
  });

  it('resolves a directory specifier to its index file', () => {
    const known = new Set(['cats/index.ts']);
    expect(resolveModuleSpecifier('main.ts', './cats', known)).toBe('cats/index.ts');
  });

  it('returns undefined when the specifier falls outside the known set', () => {
    const known = new Set(['a.ts']);
    expect(resolveModuleSpecifier('a.ts', './missing', known)).toBeUndefined();
  });
});

describe('candidateSpecifierPaths', () => {
  it('generates extension and index candidates in a stable order', () => {
    expect(candidateSpecifierPaths('src/main.ts', './cats')).toEqual([
      'src/cats',
      'src/cats.ts',
      'src/cats.tsx',
      'src/cats.js',
      'src/cats.jsx',
      'src/cats/index.ts',
      'src/cats/index.tsx',
      'src/cats/index.js',
      'src/cats/index.jsx',
    ]);
  });
});
