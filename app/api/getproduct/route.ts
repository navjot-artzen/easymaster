import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { findSessionByShop } from '@/lib/db/session-storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const nextUrl = new URL(req.url);
    const shop = nextUrl.searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Shop required.' }, { status: 422 });
    }

    const session = await findSessionByShop(shop);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Session or access token not found for this shop.' }, { status: 402 });
    }
    const shopifyResponse = await axios.post(
      `https://${shop}/admin/api/2025-07/graphql.json`,
      body,
      {
        headers: {
          'X-Shopify-Access-Token': session.accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json(shopifyResponse.data);
  } catch (error: any) {
    console.error('Shopify API error:', error.response?.data || error.message);

    return NextResponse.json(
      {
        error:
          error.response?.data?.errors?.[0]?.message ||
          'Internal Server Error',
      },
      { status: error.response?.status || 500 }
    );
  }
}