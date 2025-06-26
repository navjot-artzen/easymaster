import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { findSessionByShop } from '@/lib/db/session-storage';

const GET_PRODUCTS_TAGS_QUERY = (tag:string) => {
    return `
  query  {
    products(first: 50, query:"tag:${tag}") {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          tags
        }
      }
    }
  }
`;
}

interface ProductEdge {
    node: {
        id: string;
        tags: string[];
    };
}

interface GraphQLResponse {
    data: {
        products: {
            edges: ProductEdge[];
            pageInfo: {
                hasNextPage: boolean;
                endCursor: string | null;
            };
        };
    };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    let shop = searchParams.get('shop');
    const tag = searchParams.get('tag');

    if (!shop || !tag) {
        return withCors(NextResponse.json({ error: 'Missing shop or tag parameter.' }, { status: 400 }));
    }

    shop = shop.replace(/^https?:\/\//, '');


    const session = await findSessionByShop(shop);
    if (!session?.accessToken) {
        return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const accessToken = session.accessToken;
    let cursor: string | null = null;
    let tagExists = false;

    try {

        const response: any = await axios.post<GraphQLResponse>(
            `https://${shop}/admin/api/2024-01/graphql.json`,
            {
                query: GET_PRODUCTS_TAGS_QUERY(tag)
            },
            {
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json',
                },
            }
        );

        const productEdges = response.data?.data?.products?.edges || [];
        return withCors(NextResponse.json({ exists: !!productEdges.length }));
    } catch (error: any) {
        console.error('Tag check error:', error);
        return withCors(NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 }));
    }
}

// ✅ CORS helper
function withCors(response: NextResponse): NextResponse {
    response.headers.set('Access-Control-Allow-Origin', '*'); // or use shop-specific origin
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
}

// ✅ Handle preflight request
export function OPTIONS(): NextResponse {
    return withCors(new NextResponse(null, { status: 204 }));
}
