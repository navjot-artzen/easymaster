import prisma from "./prisma-connect";

export const makeModalEntry = async (make: any, model: any) => {
    console.log("make:", make, "model:", model)
    // Step 1: Check or create Make
    let existingMake = await prisma.make.findUnique({ where: { name: make } });
  
    if (!existingMake) {
      existingMake = await prisma.make.create({
        data: { name: make }
      });
    }
  
    // Step 2: Check or create Model under the Make
    let existingModel = await prisma.model.findFirst({
      where: {
        name: model,
        makeId: existingMake.id
      }
    });
  
    if (!existingModel) {
      existingModel = await prisma.model.create({
        data: {
          name: model,
          makeId: existingMake.id
        }
      });
    }
  }