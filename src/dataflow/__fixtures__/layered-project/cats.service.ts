import { Injectable } from '@nestjs/common';
import { CatsRepository } from './cats.repository';
import { Cat } from './interfaces/cat.interface';

@Injectable()
export class CatsService {
  constructor(private readonly catsRepository: CatsRepository) {}

  create(cat: Cat): void {
    this.catsRepository.save(cat);
  }

  findAll(): Cat[] {
    return this.catsRepository.findAll();
  }
}
