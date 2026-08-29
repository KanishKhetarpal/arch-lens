import { Module } from '@nestjs/common';
import { DataFlowModule } from '../dataflow/dataflow.module';
import { DiagramModule } from '../diagram/diagram.module';
import { ExplainModule } from '../explain/explain.module';
import { GraphModule } from '../graph/graph.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { ParserModule } from '../parser/parser.module';
import { AnalysisService } from './analysis.service';

@Module({
  imports: [
    IngestionModule,
    ParserModule,
    GraphModule,
    DataFlowModule,
    DiagramModule,
    ExplainModule,
  ],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
