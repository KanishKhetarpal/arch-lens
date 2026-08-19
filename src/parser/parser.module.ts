import { Module } from '@nestjs/common';
import { TsMorphProjectLoader } from './project/ts-morph-project-loader';

@Module({
  providers: [TsMorphProjectLoader],
  exports: [TsMorphProjectLoader],
})
export class ParserModule {}
