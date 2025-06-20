import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const makes = await prisma.make.findMany({
      include: {
        models: true,
      },
    });

    const response = NextResponse.json({ makes });

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*'); // Or use a specific domain
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
  } catch (error) {
    console.error('Error fetching makes/models:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle CORS preflight (OPTIONS method)
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });

  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*'); // Or your specific domain
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

  return response;
}
