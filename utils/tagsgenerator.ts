export function generateMakeModelYearTags(make: string, model: string, start: string, end: string): string[] {
  const startYear = parseInt(start, 10);
  const endYear = parseInt(end, 10);
  const tags: string[] = [];

  for (let y = startYear; y <= endYear; y++) {
    tags.push(`${make}-${model}-${y}`);
  }

  return tags;
}