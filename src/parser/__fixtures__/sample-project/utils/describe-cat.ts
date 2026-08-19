import Logger from './logger';
import * as MathUtils from './math';
import type { Cat } from '../interfaces/cat.interface';

export async function describeCat(cat: Cat): Promise<string> {
  const logger = new Logger();
  logger.log(`${cat.name} is ${MathUtils.add(cat.age, 1)} in cat years`);
  return cat.name;
}
