export const DEFAULT_IGNORED_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  'coverage',
  '.next',
  '.nuxt',
  '.turbo',
  '.cache',
];

export const DEFAULT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

export const DEFAULT_IGNORED_FILES = ['*.d.ts'];

/**
 * Matches a filename against glob-lite patterns: a leading "*" is treated as
 * a suffix wildcard (e.g. "*.d.ts"); anything else must match exactly.
 */
export function isIgnoredFile(filename: string, patterns: string[]): boolean {
  return patterns.some((pattern) =>
    pattern.startsWith('*') ? filename.endsWith(pattern.slice(1)) : filename === pattern,
  );
}
