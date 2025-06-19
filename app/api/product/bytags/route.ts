import { findSessionByShop } from '@/lib/db/session-storage';
import { QUERY_PRODUCTS_BY_TAGS } from '@/lib/graphql/queries';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(req: NextRequest) {
  try {
    const { shop, query } = await req.json();
    const session = await findSessionByShop(shop);
     if (!session?.accessToken) {
      return NextResponse.json({ error: 'Session or access token not found for this shop.' }, { status: 402 });
    }
    if (!shop || !query) {
      return NextResponse.json({ error: 'Missing shop or query' }, { status: 400 });
    }

    const res = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': session.accessToken,
      },
      body: JSON.stringify({
        query: QUERY_PRODUCTS_BY_TAGS,
        variables: { query },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Shopify GraphQL Error:', data);
      return NextResponse.json({ error: 'Shopify API error', details: data }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
  }
}
