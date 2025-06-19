import { readFileSync } from 'fs';
import path from 'path';

export const getCsvData = async () => {
  const csvPath = path.join(process.cwd(), 'public', 'test.csv');
  return readFileSync(csvPath, 'utf8');
};
