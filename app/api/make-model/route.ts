import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const makes = await prisma.make.findMany({
      include: {
        models: true,
      },
    });

    return NextResponse.json({ makes });
  } catch (error) {
    console.error('Error fetching makes/models:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

