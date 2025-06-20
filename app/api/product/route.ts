
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get('shop');
    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }
    const entries = await prisma.productsEntry.findMany({
      where:{
        shop
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        startFrom: true,
        end: true,
        make: true,
        model: true,
        products: {
          select: {
            title: true,
            gid: true,
          },
        },
      },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching product entries:', error);

    return NextResponse.json(
      { error: 'Failed to fetch product entries', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
