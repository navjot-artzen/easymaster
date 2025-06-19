import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import axios from 'axios';
import { findSessionByShop } from '@/lib/db/session-storage';
import { PRODUCT_UPDATE_MUTATION } from '@/lib/graphql/queries';

export const dynamic = 'force-dynamic';

type ProductEntryInput = {
  shop: string;
  year: string; // e.g., "2020-2025" or "2024"
  make: string;
  model: string;
  products: {
    productId: string;
    title: string;
  }[];
};

function extractLegacyId(gid: string): string {
  const parts = gid.split('/');
  return parts[parts.length - 1];
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

    const mutationResponses = [];
    let createdCount = 0;

    // Map to accumulate tags per product
    const productTagsMap = new Map<string, Set<string>>();

    for (const entry of payload) {
      // Validate each entry
      if (
        !entry.year ||
        !entry.make ||
        !entry.model ||
        !Array.isArray(entry.products) ||
        entry.products.length === 0
      ) {
        return NextResponse.json({ error: 'Invalid entry format' }, { status: 400 });
      }

      // Handle year range
      const [startFrom, end] = entry.year.includes('-')
        ? entry.year.split('-')
        : [entry.year, entry.year];

      // Save entry to DB
      await prisma.productsEntry.create({
        data: {
          startFrom,
          end,
          shop,
          make: entry.make,
          model: entry.model,
          products: entry.products.map((p) => ({
            title: p.title,
            gid: p.productId,
            legacyResourceId: extractLegacyId(p.productId),
          })),
        },
      });

      createdCount++;

      // Generate tag set: years + make + model
      const tagSet = new Set<string>([entry.make, entry.model]);
      for (let y = Number(startFrom); y <= Number(end); y++) {
        tagSet.add(String(y));
      }

      // Accumulate tags per product
      for (const product of entry.products) {
        const existingTags = productTagsMap.get(product.productId) || new Set<string>();
        tagSet.forEach((tag) => existingTags.add(tag));
        productTagsMap.set(product.productId, existingTags);
      }
    }

    // Now apply tags once per product
    for (const [productId, tagsSet] of productTagsMap.entries()) {
      const tags = Array.from(tagsSet);

      const graphqlData = {
        query: PRODUCT_UPDATE_MUTATION,
        variables: {
          input: {
            id: productId,
            tags,
          },
        },
      };

      const mutationRes = await axios.post(
        `https://${shop}/admin/api/2024-01/graphql.json`,
        graphqlData,
        {
          headers: {
            'X-Shopify-Access-Token': session.accessToken,
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
      message: 'Entries saved and tags updated.',
      createdCount,
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
