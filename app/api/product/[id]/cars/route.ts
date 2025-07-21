import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { LIMIT } from '@/lib/constant';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const legacyId = params.id;

  if (!legacyId) {
    return NextResponse.json(
      { error: 'Product legacyResourceId is required' },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', LIMIT);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', LIMIT);
  const skip = (page - 1) * pageSize;

  try {
    const [entries, totalCount] = await Promise.all([
      prisma.productsEntry.findMany({
        where: {
          products: {
            some: {
              legacyResourceId: legacyId,
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: {
    createdAt: 'desc',
  },
        select: {
          id: true,
          startFrom: true,
          end: true,
          make: true,
          model: true,
          driveType: true,
          createdAt: true,
          updatedAt: true,
          products: true,
        },
      }),
      prisma.productsEntry.count({
        where: {
          products: {
            some: {
              legacyResourceId: legacyId,
            },
          },
        },
      }),
    ]);

    const matchedProduct = entries[0]?.products.find(
      (p) => p.legacyResourceId === legacyId
    );
    const productTitle = matchedProduct?.title || null;

    const cleanEntries = entries.map(({ products, ...rest }) => rest);

    return NextResponse.json({
      entries: cleanEntries,
      productTitle,
      totalCount,
    });
  } catch (error) {
    console.error('Error fetching entries for legacyId:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
