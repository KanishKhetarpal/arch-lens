export interface SourceFile {
  /** Absolute path on local disk. */
  absolutePath: string;
  /** Path relative to the repo root, using forward slashes. */
  relativePath: string;
  /** File extension including the leading dot, e.g. ".ts". */
  extension: string;
}
