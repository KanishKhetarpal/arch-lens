import { Injectable } from '@nestjs/common';
import { A } from './a';

@Injectable()
export class Entry {
  constructor(private readonly a: A) {}
}
