import { Injectable } from '@nestjs/common';
import { DataFlowGraphBuilder } from '../dataflow/builder/data-flow-graph-builder';
import { DiagramModelBuilder } from '../diagram/builder/diagram-model-builder';
import { D3JsonExporter } from '../diagram/renderers/d3-json-exporter';
import { HtmlDiagramRenderer } from '../diagram/renderers/html-diagram-renderer';
import { MermaidRenderer } from '../diagram/renderers/mermaid-renderer';
import { ExplanationBuilder } from '../explain/builder/explanation-builder';
import { DependencyGraphBuilder } from '../graph/builder/dependency-graph-builder';
import { RepoSourceType } from '../ingestion/dto/repo-source.dto';
import { SourceFileEnumerator } from '../ingestion/enumeration/source-file-enumerator';
import { RepoReader } from '../ingestion/interfaces/repo-reader.interface';
import { RepoSource } from '../ingestion/models/repo-source.model';
import { FilesystemRepoReader } from '../ingestion/readers/filesystem-repo.reader';
import { GitRepoReader } from '../ingestion/readers/git-repo.reader';
import { ModuleSymbolNormalizer } from '../parser/normalization/module-symbol-normalizer';
import { AnalysisResult } from './interfaces/analysis-result.interface';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly filesystemRepoReader: FilesystemRepoReader,
    private readonly gitRepoReader: GitRepoReader,
    private readonly sourceFileEnumerator: SourceFileEnumerator,
    private readonly moduleSymbolNormalizer: ModuleSymbolNormalizer,
    private readonly dependencyGraphBuilder: DependencyGraphBuilder,
    private readonly dataFlowGraphBuilder: DataFlowGraphBuilder,
    private readonly diagramModelBuilder: DiagramModelBuilder,
    private readonly mermaidRenderer: MermaidRenderer,
    private readonly htmlDiagramRenderer: HtmlDiagramRenderer,
    private readonly d3JsonExporter: D3JsonExporter,
    private readonly explanationBuilder: ExplanationBuilder,
  ) {}

  /**
   * Runs the full pipeline (Phases 2-7) on a repo source: ingest, parse,
   * build the dependency + data-flow graph, then render the diagram and
   * explanation from it. The resolved repo (e.g. a git clone temp dir) is
   * always cleaned up, even if a later stage throws.
   */
  async analyze(source: RepoSource): Promise<AnalysisResult> {
    const reader = this.readerFor(source);
    const resolved = await reader.resolve(source);

    try {
      const files = await this.sourceFileEnumerator.enumerate(resolved.rootPath);
      const symbols = this.moduleSymbolNormalizer.normalize(files);
      const dependencyGraph = this.dependencyGraphBuilder.build(symbols);
      const dataFlowGraph = this.dataFlowGraphBuilder.build(symbols, dependencyGraph);
      const diagramModel = this.diagramModelBuilder.build(dataFlowGraph);
      const explanation = this.explanationBuilder.build(diagramModel, dataFlowGraph);

      return {
        diagramModel,
        explanation,
        mermaid: this.mermaidRenderer.render(diagramModel),
        html: this.htmlDiagramRenderer.render(diagramModel),
        d3Json: this.d3JsonExporter.export(diagramModel),
      };
    } finally {
      await resolved.cleanup();
    }
  }

  private readerFor(source: RepoSource): RepoReader {
    switch (source.type) {
      case RepoSourceType.Local:
        return this.filesystemRepoReader;
      case RepoSourceType.Git:
        return this.gitRepoReader;
      default:
        throw new Error(`Unknown RepoSource type: ${String((source as RepoSource).type)}`);
    }
  }
}
