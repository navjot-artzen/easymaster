import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PRODUCT_UPDATE_MUTATION } from '@/lib/graphql/queries';
import axios from 'axios';
import { findSessionByShop } from '@/lib/db/session-storage';
import { generateMakeModelYearTags } from '@/utils/tagsgenerator';
import { makeModalEntry } from '@/lib/db/db-function';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const entry = await prisma.productsEntry.findFirst({
      where: { id }
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error: any) {
    console.error('Error fetching entry by ID:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

// export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const id = params.id;
//     const body = await req.json();
//     const { startFrom, end, make, model, products,vehicleType, shop } = body;

//     const session = await findSessionByShop(shop);
//     if (!session) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }
//     const accessToken = session.accessToken;

//     const existingEntry = await prisma.productsEntry.findUnique({ where: { id } });
//     if (!existingEntry) {
//       return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
//     }
//     await makeModalEntry(make, model,startFrom,end);
//     const oldProductMap = new Map<string, any>(
//       (existingEntry.products || []).map((p: any) => [p.legacyResourceId, p])
//     );
//     const newProductMap = new Map<string, any>(
//       products.map((p: any) => [p.legacyResourceId, p])
//     );

//     const removedProducts = Array.from(oldProductMap.values()).filter(
//       (p) => !newProductMap.has(p.legacyResourceId)
//     );
//     const retainedProducts = Array.from(newProductMap.values());

//     // Update entry with retained products
//     const updatedEntry = await prisma.productsEntry.update({
//       where: { id },
//       data: {
//         startFrom,
//         end,
//         make,
//         model,
//         vehicleType, // ✅ Add this line
//         products: retainedProducts as any[], // ensure it’s typed as a valid Prisma JSON array
//         updatedAt: new Date(),
//       },
//     });

//     const ymmTags = generateMakeModelYearTags(make, model, startFrom, end);
//     const mutationResponses = [];

//     // === Remove YMM tags from removed products ===
//     for (const product of removedProducts) {
//       const tagRes = await axios.post(
//         `https://${shop}/admin/api/2024-01/graphql.json`,
//         {
//           query: `query { product(id: "${product.gid}") { id tags } }`,
//         },
//         {
//           headers: {
//             'X-Shopify-Access-Token': accessToken,
//             'Content-Type': 'application/json',
//           },
//         }
//       );

//       const existingTags: string[] = tagRes.data?.data?.product?.tags || [];
//       const cleanedTags = existingTags.filter(
//         (tag) => !ymmTags.includes(tag)
//       );

//       await axios.post(
//         `https://${shop}/admin/api/2024-01/graphql.json`,
//         {
//           query: PRODUCT_UPDATE_MUTATION,
//           variables: {
//             input: {
//               id: product.gid,
//               tags: cleanedTags,
//             },
//           },
//         },
//         {
//           headers: {
//             'X-Shopify-Access-Token': accessToken,
//             'Content-Type': 'application/json',
//           },
//         }
//       );
//     }

//     // === Add YMM tags to retained products ===
//     for (const product of retainedProducts) {
//       const tagRes = await axios.post(
//         `https://${shop}/admin/api/2024-01/graphql.json`,
//         {
//           query: `query { product(id: "${product.gid}") { id tags } }`,
//         },
//         {
//           headers: {
//             'X-Shopify-Access-Token': accessToken,
//             'Content-Type': 'application/json',
//           },
//         }
//       );

//       const existingTags: string[] = tagRes.data?.data?.product?.tags || [];

//       // Keep unrelated tags
//       const filteredTags = existingTags.filter(
//         (tag) => !ymmTags.includes(tag)
//       );

//       // Merge with current YMM tags
//       const mergedTags = Array.from(new Set([...filteredTags, ...ymmTags]));

//       const mutationRes = await axios.post(
//         `https://${shop}/admin/api/2024-01/graphql.json`,
//         {
//           query: PRODUCT_UPDATE_MUTATION,
//           variables: {
//             input: {
//               id: product.gid,
//               tags: mergedTags,
//             },
//           },
//         },
//         {
//           headers: {
//             'X-Shopify-Access-Token': accessToken,
//             'Content-Type': 'application/json',
//           },
//         }
//       );

//       mutationResponses.push({
//         productId: product.gid,
//         result: mutationRes.data,
//       });
//     }

//     return NextResponse.json({
//       message: 'Entry updated and product tags synced.',
//       updatedEntry,
//       mutations: mutationResponses,
//     });
//   } catch (error: any) {
//     console.error('Error updating entry:', error);
//     return NextResponse.json({ message: 'Failed to update entry.', error: error.message }, { status: 500 });
//   }
// }

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json();
    const { startFrom, end, make, model, products, vehicleType, shop } = body;

    const session = await findSessionByShop(shop);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accessToken = session.accessToken;

    const existingEntry = await prisma.productsEntry.findUnique({ where: { id } });
    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const oldYmmTags = generateMakeModelYearTags(
      existingEntry.make,
      existingEntry.model,
      existingEntry.startFrom,
      existingEntry.end
    );

    const newYmmTags = generateMakeModelYearTags(make, model, startFrom, end);

    const oldProductMap = new Map<string, any>(
      (existingEntry.products || []).map((p: any) => [p.legacyResourceId, p])
    );
    const newProductMap = new Map<string, any>(
      products.map((p: any) => [p.legacyResourceId, p])
    );

    const removedProducts = Array.from(oldProductMap.values()).filter(
      (p) => !newProductMap.has(p.legacyResourceId)
    );
    const retainedProducts = Array.from(newProductMap.values());

    // === Remove old YMM tags from removed products ===
    for (const product of removedProducts) {
      const tagRes = await axios.post(
        `https://${shop}/admin/api/2024-01/graphql.json`,
        {
          query: `query { product(id: "${product.gid}") { id tags } }`,
        },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      const existingTags: string[] = tagRes.data?.data?.product?.tags || [];
      const cleanedTags = existingTags.filter(tag => !oldYmmTags.includes(tag));

      await axios.post(
        `https://${shop}/admin/api/2024-01/graphql.json`,
        {
          query: PRODUCT_UPDATE_MUTATION,
          variables: {
            input: {
              id: product.gid,
              tags: cleanedTags,
            },
          },
        },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // === Add new YMM tags to retained products ===
    const mutationResponses = [];

    for (const product of retainedProducts) {
      const tagRes = await axios.post(
        `https://${shop}/admin/api/2024-01/graphql.json`,
        {
          query: `query { product(id: "${product.gid}") { id tags } }`,
        },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      const existingTags: string[] = tagRes.data?.data?.product?.tags || [];

      // Keep unrelated tags
      const filteredTags = existingTags.filter(tag => !oldYmmTags.includes(tag));

      // Merge with new YMM tags
      const mergedTags = Array.from(new Set([...filteredTags, ...newYmmTags]));

      const mutationRes = await axios.post(
        `https://${shop}/admin/api/2024-01/graphql.json`,
        {
          query: PRODUCT_UPDATE_MUTATION,
          variables: {
            input: {
              id: product.gid,
              tags: mergedTags,
            },
          },
        },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      mutationResponses.push({
        productId: product.gid,
        result: mutationRes.data,
      });
    }

    // === Update the DB entry ===
    const updatedEntry = await prisma.productsEntry.update({
      where: { id },
      data: {
        startFrom,
        end,
        make,
        model,
        vehicleType,
        products: retainedProducts as any[],
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Entry updated and product tags synced.',
      updatedEntry,
      mutations: mutationResponses,
    });
  } catch (error: any) {
    console.error('Error updating entry:', error);
    return NextResponse.json({ message: 'Failed to update entry.', error: error.message }, { status: 500 });
  }
}
