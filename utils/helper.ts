export function generateMakeModelYearTags(make: string, model: string, start: string, end: string, driveType: any): string[] {
  const startYear = parseInt(start, 10);
  const endYear = parseInt(end, 10);
  const tags: string[] = [];

  for (let y = startYear; y <= endYear; y++) {
    tags.push(`${make}-${model}-${driveType}-${y}`);
  }

  return tags;
}


 export function formatEngineOptions(value: unknown): string {
    if (!value) return '-';

    const cleanSingle = (str: string): string => {
      const match = str.match(/[^,\s]+L/i); // captures '4.5L' etc.
      return match ? match[0].toUpperCase() : str;
    };

    if (Array.isArray(value)) {
      return value
        .filter(Boolean)
        .map((item) => cleanSingle(item.toString()))
        .join(', ');
    }

    if (typeof value === 'string') {
      return value
        .split(/[,;\s]+/)
        .filter(Boolean)
        .map(cleanSingle)
        .join(', ');
    }

    return '-';
  }