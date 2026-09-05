#!/usr/bin/env node
import { NestFactory } from '@nestjs/core';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { AnalysisService } from '../analysis/analysis.service';
import { AppModule } from '../app.module';
import { RepoSourceType } from '../ingestion/dto/repo-source.dto';
import { GalleryIndexBuilder, GallerySampleSummary } from './gallery-index-builder';
import { GALLERY_SAMPLES } from './gallery-samples';

const DEFAULT_OUT_DIR = 'gallery-out';

async function main(): Promise<void> {
  const outDir = process.argv[2] ?? DEFAULT_OUT_DIR;

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    const analysisService = app.get(AnalysisService);
    const indexBuilder = new GalleryIndexBuilder();
    const summaries: GallerySampleSummary[] = [];

    for (const sample of GALLERY_SAMPLES) {
      console.log(`Analyzing ${sample.name} (${sample.path})...`);
      const result = await analysisService.analyze({
        type: RepoSourceType.Local,
        path: sample.path,
      });

      const sampleOutDir = join(outDir, sample.id);
      await fs.mkdir(sampleOutDir, { recursive: true });
      await Promise.all([
        fs.writeFile(join(sampleOutDir, 'diagram.mmd'), result.mermaid, 'utf8'),
        fs.writeFile(join(sampleOutDir, 'diagram.html'), result.html, 'utf8'),
        fs.writeFile(
          join(sampleOutDir, 'diagram.json'),
          JSON.stringify(result.d3Json, null, 2),
          'utf8',
        ),
        fs.writeFile(join(sampleOutDir, 'explanation.md'), result.explanation.prompt, 'utf8'),
      ]);

      summaries.push({
        id: sample.id,
        name: sample.name,
        description: sample.description,
        moduleCount: result.diagramModel.nodes.length,
        cycleCount: result.diagramModel.cycles.length,
      });
    }

    await fs.writeFile(join(outDir, 'index.html'), indexBuilder.build(summaries), 'utf8');

    console.log(`Gallery for ${summaries.length} sample(s) written to ${outDir}/`);
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
