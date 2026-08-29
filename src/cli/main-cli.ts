#!/usr/bin/env node
import { NestFactory } from '@nestjs/core';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { AnalysisService } from '../analysis/analysis.service';
import { AppModule } from '../app.module';
import { RepoSourceType } from '../ingestion/dto/repo-source.dto';
import { RepoSource } from '../ingestion/models/repo-source.model';

const USAGE = 'Usage: arch-lens analyze <path-or-git-url> [--out <dir>] [--ref <branch>]';

interface CliOptions {
  target: string;
  outDir: string;
  ref?: string;
}

function parseArgs(argv: string[]): CliOptions {
  const [command, target, ...rest] = argv;
  if (command !== 'analyze' || !target) {
    throw new Error(USAGE);
  }

  let outDir = 'arch-lens-out';
  let ref: string | undefined;
  for (let i = 0; i < rest.length; i += 1) {
    if (rest[i] === '--out' && rest[i + 1]) {
      outDir = rest[i + 1];
      i += 1;
    } else if (rest[i] === '--ref' && rest[i + 1]) {
      ref = rest[i + 1];
      i += 1;
    } else {
      throw new Error(`${USAGE}\nUnrecognized argument: ${rest[i]}`);
    }
  }

  return { target, outDir, ref };
}

function toRepoSource(options: CliOptions): RepoSource {
  const isGitUrl = /^(https?:\/\/|git@)/.test(options.target) || options.target.endsWith('.git');
  return isGitUrl
    ? { type: RepoSourceType.Git, url: options.target, ref: options.ref }
    : { type: RepoSourceType.Local, path: options.target };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const source = toRepoSource(options);

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    const analysisService = app.get(AnalysisService);
    const result = await analysisService.analyze(source);

    await fs.mkdir(options.outDir, { recursive: true });
    await Promise.all([
      fs.writeFile(join(options.outDir, 'diagram.mmd'), result.mermaid, 'utf8'),
      fs.writeFile(join(options.outDir, 'diagram.html'), result.html, 'utf8'),
      fs.writeFile(
        join(options.outDir, 'diagram.json'),
        JSON.stringify(result.d3Json, null, 2),
        'utf8',
      ),
      fs.writeFile(join(options.outDir, 'explanation.md'), result.explanation.prompt, 'utf8'),
    ]);

    console.log(
      `Analyzed ${result.diagramModel.nodes.length} module(s), ` +
        `${result.diagramModel.cycles.length} cycle(s) found.`,
    );
    console.log(`Output written to ${options.outDir}/`);
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
