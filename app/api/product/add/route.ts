import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import axios from 'axios';
import { findSessionByShop } from '@/lib/db/session-storage';
import { PRODUCT_UPDATE_MUTATION } from '@/lib/graphql/queries';
import { generateMakeModelYearTags } from '@/utils/helper';
import { makeModalEntry } from '@/lib/db/db-function';
import { ProductEntryInput } from '@/types/interfaces';

export const dynamic = 'force-dynamic';

function extractLegacyId(gid: string): string {
  const parts = gid.split('/');
  return parts[parts.length - 1];
}

function normalizeString(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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
        !entry.products ||
        !Array.isArray(entry.products) ||
        entry.products.length === 0
      ) {
        return NextResponse.json({ error: 'Invalid entry format' }, { status: 400 });
      }

      const cleanedMake = normalizeString(entry.make.trim());
      const cleanedModel = normalizeString(entry.model.trim());

      const [startFrom, end] = entry.year.includes('-')
        ? entry.year.split('-')
        : [entry.year, entry.year];
      const startYear = parseInt(startFrom, 10);
      const endYear = parseInt(end, 10);

      const productLegacyIds = entry.products.map((p) => extractLegacyId(p.productId));

      const existingEntries = await prisma.productsEntry.findMany({
        where: {
          shop,
          products: {
            some: {
              legacyResourceId: {
                in: productLegacyIds,
              },
            },
          },
        },
        include: {
          products: true,
        },
      });

      const matchedEntries = existingEntries.filter((existing) => {
        const existingMake = normalizeString(existing.make.trim());
        const existingModel = normalizeString(existing.model.trim());
        const existingStart = parseInt(existing.startFrom, 10);
        const existingEnd = parseInt(existing.end, 10);

        const overlaps = yearsOverlap(existingStart, existingEnd, startYear, endYear);
        const sameProducts = existing.products.some((existingProduct: any) =>
          productLegacyIds.includes(existingProduct.legacyResourceId)
        );

        return (
          existingMake === cleanedMake &&
          existingModel === cleanedModel &&
          overlaps &&
          sameProducts
        );
      });

      if (matchedEntries.length > 0) {
        for (const matched of matchedEntries) {
          const updateData: any = {};
          if (!matched.engineType && entry.engineType) {
            updateData.engineType = entry.engineType;
          }
          if (!matched.driveType && entry.driveType) {
            updateData.driveType = entry.driveType;
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.productsEntry.update({
              where: { id: matched.id },
              data: updateData,
            });

            duplicateEntries.push({
              make: cleanedMake,
              model: cleanedModel,
              year: entry.year,
              message: `Updated entry ID ${matched.id} with missing fields.`,
            });
          } else {
            duplicateEntries.push({
              make: cleanedMake,
              model: cleanedModel,
              year: entry.year,
              message: `Duplicate entry found (ID ${matched.id}), no updates needed.`,
            });
          }
        }

        // ✅ Always add tags for matched (existing) entries too
        const ymmTags = generateMakeModelYearTags(
          cleanedMake,
          cleanedModel,
          startFrom,
          end,
          entry.driveType,
          entry.engineType
        );

        for (const product of entry.products) {
          const existingTags = productTagsMap.get(product.productId) || new Set<string>();
          ymmTags.forEach((tag) => existingTags.add(tag));
          productTagsMap.set(product.productId, existingTags);
        }

        continue;
      }

      // New entry case
      await makeModalEntry(cleanedMake, cleanedModel, startFrom, end);

      await prisma.productsEntry.create({
        data: {
          startFrom,
          end,
          shop,
          make: cleanedMake,
          model: cleanedModel,
          driveType: entry.driveType,
          engineType: entry.engineType,
          note: entry.note,
          products: entry.products.map((p) => ({
            title: p.title,
            gid: p.productId,
            legacyResourceId: extractLegacyId(p.productId),
          })),
        },
      });

      createdCount++;

      // ✅ Also collect tags for new entries
      const ymmTags = generateMakeModelYearTags(
        cleanedMake,
        cleanedModel,
        startFrom,
        end,
        entry.driveType,
        entry.engineType
      );

      for (const product of entry.products) {
        const existingTags = productTagsMap.get(product.productId) || new Set<string>();
        ymmTags.forEach((tag) => existingTags.add(tag));
        productTagsMap.set(product.productId, existingTags);
      }
    }

    // ✅ Apply tags to Shopify products (whether new or existing entries)
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
      duplicateEntries,
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
