import prisma from '@/lib/prisma';

export const getCsvData = async () => {
     const activeFile = await prisma.csvFile.findFirst({
      where: { active: true, isProcessed: false },
      orderBy: { createdAt: 'asc' },
    });

  if (!activeFile || !activeFile.url) {
    throw new Error("No CSV file found in the database");
  }

  const res = await fetch(activeFile.url);
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV from URL: ${res.statusText}`);
  }

  return await res.text();
};
