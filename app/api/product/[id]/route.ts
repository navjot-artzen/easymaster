import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PRODUCT_UPDATE_MUTATION } from '@/lib/graphql/queries';
import axios from 'axios';
import { findSessionByShop } from '@/lib/db/session-storage';

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

function generateYearTags(start: string, end: string): string[] {
  const startYear = parseInt(start, 10);
  const endYear = parseInt(end, 10);
  const years: string[] = [];

  for (let y = startYear; y <= endYear; y++) {
    years.push(String(y));
  }

  return years;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json();
    const { startFrom, end, make, model, products, shop } = body;

    const session = await findSessionByShop(shop);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = session.accessToken;
    const mutationResponses = [];

    // Step 1: Get current entry
    const existingEntry = await prisma.productsEntry.findUnique({ where: { id } });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const existingProductsMap = new Map(
      (existingEntry.products || []).map((p: any) => [p.legacyResourceId, p])
    );

    const updatedProducts = Array.from(existingProductsMap.values());

    for (const product of products) {
      if (!existingProductsMap.has(product.legacyResourceId)) {
        updatedProducts.push({
          gid: product.id,
          title: product.title,
          legacyResourceId: product.legacyResourceId,
        });
      }
    }

    // Step 2: Update entry in DB
    const updatedEntry = await prisma.productsEntry.update({
      where: { id },
      data: {
        startFrom,
        end,
        make,
        model,
        products: updatedProducts,
        updatedAt: new Date(),
      },
    });

    // Step 3: Update tags on Shopify for each product
    for (const product of updatedProducts) {
      // Fetch current tags
      const fetchTagsQuery = {
        query: `
          query {
            product(id: "${product.gid}") {
              id
              tags
            }
          }
        `,
      };

      const tagRes = await axios.post(
        `https://${shop}/admin/api/2024-01/graphql.json`,
        fetchTagsQuery,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      const existingTags = tagRes.data?.data?.product?.tags || [];

      // Remove year range and existing make/model/year tags
      const updatedTags = existingTags
        .filter((tag: string) => !/^\d{4}-\d{4}$/.test(tag)) // remove ranges
        .filter((tag: string) => isNaN(Number(tag)) || Number(tag) < 1900 || Number(tag) > 2100) // remove years
        .filter((tag: string) => tag !== make && tag !== model)
        .concat(generateYearTags(startFrom, end), [make, model]);

      // Update tags via mutation
      const graphqlData = {
        query: PRODUCT_UPDATE_MUTATION,
        variables: {
          input: {
            id: product.gid,
            tags: updatedTags,
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
        productId: product.gid,
        result: mutationRes.data,
      });
    }

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





