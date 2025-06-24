// // --- UPDATED API WITH PAGINATION ---
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';

// export const dynamic = 'force-dynamic';

// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const shop = searchParams.get('shop');
//     const page = parseInt(searchParams.get('page') || '1');
//     const limit = parseInt(searchParams.get('limit') || '10');

//     if (!shop) {
//       return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
//     }

//     const totalCount = await prisma.productsEntry.count({ where: { shop } });

//     const entries = await prisma.productsEntry.findMany({
//       where: { shop },
//       orderBy: { createdAt: 'desc' },
//       skip: (page - 1) * limit,
//       take: limit,
//       select: {
//         id: true,
//         startFrom: true,
//         end: true,
//         make: true,
//         model: true,
//         vehicleType: true,
//         products: {
//           select: {
//             title: true,
//             gid: true,
//             legacyResourceId: true,
//           },
//         },
//       },
//     });

//     return NextResponse.json({ entries, totalCount });
//   } catch (error) {
//     console.error('Error fetching product entries:', error);
//     return NextResponse.json(
//       {
//         error: 'Failed to fetch product entries',
//         details: error instanceof Error ? error.message : 'Unknown',
//       },
//       { status: 500 }
//     );
//   }
// }


import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get('shop');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    // ✅ Fetch all entries for the shop
    const paginatedEntries = await prisma.productsEntry.findMany({
      where: { shop },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        startFrom: true,
        end: true,
        make: true,
        model: true,
        vehicleType: true,
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
    const flattened = paginatedEntries.flatMap((entry) =>
      entry.products.map((product) => ({
        entryId: entry.id,
        productTitle: product.title,
        make: entry.make,
        model: entry.model,
        year: `${entry.startFrom} - ${entry.end}`,
        legacyResourceId: product.legacyResourceId,
        vehicleType: entry.vehicleType || 'ALL',
      }))
    );

    const totalCount = flattened.length;

    // ✅ Apply pagination to the flattened result
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
        details: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 }
    );
  }
}
