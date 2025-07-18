import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const shop = searchParams.get('shop');
    const model = searchParams.get('model');
    const make = searchParams.get('make');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    // ✅ Build dynamic filter
    const where: any = { shop };
    if (make) where.make = make;
    if (model) where.model = model;

    // ✅ Fetch filtered entries (before flattening)
    const entries = await prisma.productsEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        startFrom: true,
        end: true,
        make: true,
        model: true,
        driveType: true,
        engineType: true,
        note: true,
        products: {
          select: {
            title: true,
            gid: true,
            legacyResourceId: true,
          },
        },
      },
    });

    // ✅ Flatten entries into product-level array
    const flattened = entries.flatMap((entry) =>
      entry.products.map((product) => ({
        entryId: entry.id,
        productTitle: product.title,
        make: entry.make,
        model: entry.model,
        year: `${entry.startFrom} - ${entry.end}`,
        legacyResourceId: product.legacyResourceId,
        driveType: entry.driveType || '-',
        engineType: entry.engineType || '-',
        note: entry.note || '',
      }))
    );

    const totalCount = flattened.length;

    // ✅ Apply pagination after flattening
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedFlattened = flattened.slice(start, end);

    return NextResponse.json({
      entries: paginatedFlattened,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error('Error fetching product entries:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch product entries',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
