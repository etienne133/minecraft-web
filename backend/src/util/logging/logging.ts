import { insertOne } from '../../repositories';

export const COLLECTION = 'log';

export enum Level {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export async function logIntoDB(msg: string, level: Level = Level.INFO): Promise<void> {
  const now = new Date();
  const log = `[${level}]\t${now} - ${msg}`;
  console.log(log);
  insertOne({ entry: log }, COLLECTION);
}
