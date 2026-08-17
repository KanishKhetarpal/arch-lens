import { join } from 'node:path';
import { SourceFileEnumerator } from './source-file-enumerator';

describe('SourceFileEnumerator', () => {
  const fixtureRoot = join(__dirname, '__fixtures__', 'sample-repo');
  let enumerator: SourceFileEnumerator;

  beforeEach(() => {
    enumerator = new SourceFileEnumerator();
  });

  it('finds source files while skipping ignored dirs and non-source extensions', async () => {
    const files = await enumerator.enumerate(fixtureRoot);

    expect(files.map((file) => file.relativePath)).toEqual([
      'src/index.ts',
      'src/utils/helper.spec.ts',
      'src/utils/helper.ts',
    ]);
  });

  it('excludes *.d.ts files by default', async () => {
    const files = await enumerator.enumerate(fixtureRoot);
    expect(files.some((file) => file.relativePath.endsWith('types.d.ts'))).toBe(false);
  });

  it('never descends into node_modules or dist', async () => {
    const files = await enumerator.enumerate(fixtureRoot);
    expect(files.some((file) => file.relativePath.includes('node_modules'))).toBe(false);
    expect(files.some((file) => file.relativePath.includes('dist'))).toBe(false);
  });

  it('populates absolutePath and extension for each entry', async () => {
    const files = await enumerator.enumerate(fixtureRoot);
    const index = files.find((file) => file.relativePath === 'src/index.ts');

    expect(index?.extension).toBe('.ts');
    expect(index?.absolutePath).toBe(join(fixtureRoot, 'src', 'index.ts'));
  });

  it('honors custom ignoreFiles patterns', async () => {
    const files = await enumerator.enumerate(fixtureRoot, {
      ignoreFiles: ['*.d.ts', '*.spec.ts'],
    });

    expect(files.map((file) => file.relativePath)).toEqual(['src/index.ts', 'src/utils/helper.ts']);
  });

  it('honors a custom extensions allowlist', async () => {
    const files = await enumerator.enumerate(fixtureRoot, { extensions: ['.md'] });
    expect(files.map((file) => file.relativePath)).toEqual(['README.md']);
  });

  it('honors a custom ignoreDirs list', async () => {
    const files = await enumerator.enumerate(fixtureRoot, {
      extensions: ['.js'],
      ignoreDirs: ['dist'],
    });

    expect(files.map((file) => file.relativePath)).toEqual(['node_modules/some-pkg/index.js']);
  });

  it('returns an empty array when no files match the extensions allowlist', async () => {
    const files = await enumerator.enumerate(join(fixtureRoot, 'src'), { extensions: ['.md'] });
    expect(files).toEqual([]);
  });
});
