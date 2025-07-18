export function generateMakeModelYearTags(
  make: string,
  model: string,
  start: string,
  end: string,
  driveType: string,
  engineTypes: string | string[]
): string[] {
  const startYear = parseInt(start, 10);
  const endYear = parseInt(end, 10);
  const tags: string[] = [];

  const engines = Array.isArray(engineTypes)
    ? engineTypes
    : engineTypes.split(',').map(e => e.trim());

  for (let year = startYear; year <= endYear; year++) {
    // First tag: make-model-year
    tags.push(`eps-${make.toLowerCase()}-${model.toLowerCase()}-${year}`);

    // Second tag: make-model-driveType-year-safeEngine
    for (const engine of engines) {
      const safeEngine = engine.replace(/\./g, 'o');
      tags.push(`eps-${make.toLowerCase()}-${model.toLowerCase()}-${driveType}-${year}-${safeEngine}`);
    }
  }

  return tags;
}


export function generateSimpleTags(
  make: string,
  model: string,
  start: string,
  end: string
): string[] {
  const startYear = parseInt(start, 10);
  const endYear = parseInt(end, 10);
  const tags: string[] = [];

  for (let year = startYear; year <= endYear; year++) {
    tags.push(`eps-${make.toLowerCase()}-${model.toLowerCase()}-${year}`);
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