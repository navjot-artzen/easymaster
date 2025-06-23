// utils/makeModelEntry.ts
import prisma from '@/lib/prisma';

export const makeModalEntry = async (make: string, model: string, from: string, to: string) => {
  if (!make || !model || !from || !to) {
    throw new Error('Make, model, from, and to are required');
  }

  // Step 1: Check or create Make
  let existingMake = await prisma.make.findUnique({
    where: { name: make.trim() },
  });

  if (!existingMake) {
    existingMake = await prisma.make.create({
      data: { name: make.trim() },
    });
  }

  // Step 2: Check or create Model
  let existingModel = await prisma.model.findFirst({
    where: {
      name: model.trim(),
      makeId: existingMake.id,
    },
  });

  if (!existingModel) {
    existingModel = await prisma.model.create({
      data: {
        name: model.trim(),
        makeId: existingMake.id,
      },
    });
  }

  // Step 3: Check or create YearEntry
  let existingYearEntry = await prisma.yearEntry.findFirst({
    where: {
      from,
      to,
      makeId: existingMake.id,
      modelId: existingModel.id,
    },
  });

  if (!existingYearEntry) {
    existingYearEntry = await prisma.yearEntry.create({
      data: {
        from,
        to,
        makeId: existingMake.id,
        modelId: existingModel.id,
      },
    });
  }

  return {
    make: existingMake,
    model: existingModel,
    yearEntry: existingYearEntry,
  };
};
