import { join } from 'node:path';
import { TsMorphProjectLoader } from './ts-morph-project-loader';

describe('TsMorphProjectLoader', () => {
  const fixtureRoot = join(__dirname, '..', '__fixtures__', 'sample-project');
  let loader: TsMorphProjectLoader;

  beforeEach(() => {
    loader = new TsMorphProjectLoader();
  });

  it('loads only the given files into the project', () => {
    const absolutePath = join(fixtureRoot, 'cats.service.ts');
    const project = loader.load([
      { absolutePath, relativePath: 'cats.service.ts', extension: '.ts' },
    ]);

    expect(project.getSourceFiles()).toHaveLength(1);
    expect(project.getSourceFileOrThrow(absolutePath).getFilePath()).toContain('cats.service.ts');
  });

  it('does not pull in imported files automatically', () => {
    const absolutePath = join(fixtureRoot, 'cats.controller.ts');
    const project = loader.load([
      { absolutePath, relativePath: 'cats.controller.ts', extension: '.ts' },
    ]);

    expect(project.getSourceFiles()).toHaveLength(1);
  });

  it('loadFile returns the parsed source file directly', () => {
    const absolutePath = join(fixtureRoot, 'cats.service.ts');
    const sourceFile = loader.loadFile({
      absolutePath,
      relativePath: 'cats.service.ts',
      extension: '.ts',
    });

    expect(sourceFile.getClasses().map((c) => c.getName())).toEqual(['CatsService']);
  });
});
