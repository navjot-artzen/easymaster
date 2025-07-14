import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  console.log("entering in api");

  const { searchParams } = new URL(req.url);
  const legacyId = searchParams.get('legacyId');

  if (!legacyId || typeof legacyId !== 'string') {
    return NextResponse.json(
      { error: 'Product legacyResourceId is required' },
      { status: 400 }
    );
  }

  try {
    const entries = await prisma.productsEntry.findMany({
      where: {
        products: {
          some: {
            legacyResourceId: legacyId,
          },
        },
      },
      select: {
        products: true,
      },
    });

    const matchedProduct = entries[0]?.products.find(
      (p) => p.legacyResourceId === legacyId
    );

    if (!matchedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      legacyId: matchedProduct.legacyResourceId,
      gid: matchedProduct.gid,
      productTitle: matchedProduct.title,
    });
  } catch (error) {
    console.error('Error fetching entries for legacyId:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
