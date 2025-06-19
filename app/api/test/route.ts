import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const products = await prisma.productsEntry.findMany({})
    // const entry = await prisma.productsEntry.create({
    //   data: {
    //     startFrom: '2020',
    //     end: '2024',
    //     make: 'Toyota',
    //     model: 'Corolla',
    //     products: [
    //         {
    //             gid: 'gid://shopify/Product/1234567890',
    //             title: 'Test Product A',
    //             legacyResourceId: '11111111',
    //         },
    //         {
    //           gid: 'gid://shopify/Product/0987654321',
    //           title: 'Test Product B',
    //           legacyResourceId: '22222222',
    //         },
    //       ],
    //   }
    // });

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create entry' }, { status: 500 });
  }
}
