import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import axios from 'axios';
import { findSessionByShop } from '@/lib/db/session-storage';
import { PRODUCT_UPDATE_MUTATION } from '@/lib/graphql/queries';
import { generateMakeModelYearTags } from '@/utils/tagsgenerator';
import { makeModalEntry } from '@/lib/db/db-function';

export const dynamic = 'force-dynamic';

type ProductEntryInput = {
  shop: string;
  year: string;
  make: string;
  model: string;
  vehicleType: string;
  products: {
    productId: string;
    title: string;
  }[];
};

function extractLegacyId(gid: string): string {
  const parts = gid.split('/');
  return parts[parts.length - 1];
}

const GET_PRODUCT_TAGS_QUERY = `
  query getProductTags($id: ID!) {
    product(id: $id) {
      tags
    }
  }
`;

function yearsOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA <= endB && startB <= endA;
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ProductEntryInput[];
    if (!Array.isArray(payload) || payload.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const shop = payload[0].shop;
    if (!shop) {
      return NextResponse.json({ error: 'Missing shop' }, { status: 400 });
    }

    const session = await findSessionByShop(shop);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Session or access token not found.' }, { status: 402 });
    }

    const accessToken = session.accessToken;
    const mutationResponses = [];
    let createdCount = 0;
    const productTagsMap = new Map<string, Set<string>>();
    const duplicateEntries: any[] = [];

    for (const entry of payload) {
      if (
        !entry.year ||
        !entry.make ||
        !entry.model ||
        !entry.vehicleType ||
        !Array.isArray(entry.products) ||
        entry.products.length === 0
      ) {
        return NextResponse.json({ error: 'Invalid entry format' }, { status: 400 });
      }

      const [startFrom, end] = entry.year.includes('-')
        ? entry.year.split('-')
        : [entry.year, entry.year];
      const startYear = parseInt(startFrom, 10);
      const endYear = parseInt(end, 10);

      const productLegacyIds = entry.products.map((p) => extractLegacyId(p.productId));

      const existingEntries = await prisma.productsEntry.findMany({
        where: {
          shop,
          make: entry.make,
          model: entry.model,
          products: {
            some: {
              legacyResourceId: {
                in: productLegacyIds,
              },
            },
          },
        },
      });

      const isDuplicate = existingEntries.some((existing) => {
        const existingStart = parseInt(existing.startFrom, 10);
        const existingEnd = parseInt(existing.end, 10);

        const overlaps = yearsOverlap(existingStart, existingEnd, startYear, endYear);
        const sameProducts = existing.products.some((existingProduct: any) =>
          productLegacyIds.includes(existingProduct.legacyResourceId)
        );

        return overlaps && sameProducts;
      });

      if (isDuplicate) {
        duplicateEntries.push({
          make: entry.make,
          model: entry.model,
          year: entry.year,
          message: 'This entry already exists for one or more selected products.',
        });
        continue;
      }

      await makeModalEntry(entry.make, entry.model, startFrom, end);

      await prisma.productsEntry.create({
        data: {
          startFrom,
          end,
          shop,
          make: entry.make,
          model: entry.model,
          vehicleType: entry.vehicleType,
          products: entry.products.map((p) => ({
            title: p.title,
            gid: p.productId,
            legacyResourceId: extractLegacyId(p.productId),
          })),
        },
      });

      createdCount++;

      const ymmTags = generateMakeModelYearTags(entry.make, entry.model, startFrom, end);
      for (const product of entry.products) {
        const existingTags = productTagsMap.get(product.productId) || new Set<string>();
        ymmTags.forEach((tag) => existingTags.add(tag));
        productTagsMap.set(product.productId, existingTags);
      }
    }

    for (const [productId, tagsSet] of productTagsMap.entries()) {
      const existingRes = await axios.post(
        `https://${shop}/admin/api/2024-01/graphql.json`,
        {
          query: GET_PRODUCT_TAGS_QUERY,
          variables: { id: productId },
        },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      const existingTags: string[] = existingRes.data?.data?.product?.tags || [];
      const newTags = Array.from(tagsSet);
      const mergedTags = Array.from(new Set([...existingTags, ...newTags]));

      const graphqlData = {
        query: PRODUCT_UPDATE_MUTATION,
        variables: {
          input: {
            id: productId,
            tags: mergedTags,
          },
        },
      };

      const mutationRes = await axios.post(
        `https://${shop}/admin/api/2024-01/graphql.json`,
        graphqlData,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      mutationResponses.push({
        productId,
        result: mutationRes.data,
      });
    }

    return NextResponse.json({
      message: `${createdCount} entries saved.`,
      createdCount,
      duplicateEntries, // ✅ Return all skipped duplicates
      mutations: mutationResponses,
    });
  } catch (error: any) {
    console.error('Error saving product entries:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    );
  }
}

