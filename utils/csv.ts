import prisma from '@/lib/prisma';

export const getCsvData = async () => {
  const latestFile = await prisma.csvFile.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!latestFile || !latestFile.url) {
    throw new Error("No CSV file found in the database");
  }

  const res = await fetch(latestFile.url);
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV from URL: ${res.statusText}`);
  }

  return await res.text();
};
