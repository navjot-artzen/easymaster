// File: app/api/product/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const entries = await prisma.productsEntry.findMany({
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
