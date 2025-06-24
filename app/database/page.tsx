'use client';

import { useAppBridge } from '@shopify/app-bridge-react';
import {
  Page,
  Card,
  IndexTable,
  Spinner,
  BlockStack,
  Button,
  Pagination,
  InlineStack,
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProductEntry {
  id: string;
  startFrom: string;
  end: string;
  make: string;
  model: string;
  vehicleType?: string;
  products: {
    gid: string;
    title: string;
    legacyResourceId: string;
  }[];
}

interface FlatProductRow {
  entryId: string;
  productTitle: string;
  make: string;
  model: string;
  year: string;
  legacyResourceId: string;
  vehicleType?: string;
}

export default function SearchEntryListPage() {
  const [entries, setEntries] = useState<FlatProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const router = useRouter();
  const app = useAppBridge();

  useEffect(() => {
    const shop = app?.config?.shop;
    if (!shop) return;

    const fetchEntries = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/product?shop=${shop}&page=${page}&limit=${limit}`);
        if (!res.ok) throw new Error('Failed to fetch entries');
        const { entries, totalCount } = await res.json();
        console.log(entries, totalCount ,"entries, totalCount ")
        setEntries(entries);
        setTotalCount(totalCount);
      } catch (error) {
        console.error('Error fetching entries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [app, page]);
  console.log(entries, page ,"entries, page ")
  const flatRows = entries || []
  // const flatRows: FlatProductRow[] = entries.flatMap((entry) =>
  //   entry.products.map((product) => ({
  //     entryId: entry.id,
  //     productTitle: product.title,
  //     make: entry.make,
  //     model: entry.model,
  //     year: `${entry.startFrom} - ${entry.end}`,
  //     legacyResourceId: product.legacyResourceId,
  //     vehicleType: entry.vehicleType || 'ALL',
  //   }))
  // );

  const totalPages = Math.ceil(totalCount / limit);
 
  return (
    <Page
      title="Search entries & results"
      primaryAction={
        <InlineStack gap="400">
          <Button onClick={() => router.push('/database/upload-csv')}>Upload CSV</Button>
          <Button onClick={() => router.push('/database/create')} variant="primary">
            Add search entry
          </Button>
        </InlineStack>
      }
    >
      <Card>
        {loading ? (
          <BlockStack align="center" inlineAlign="center" gap="400">
            <Spinner accessibilityLabel="Loading entries" size="large" />
          </BlockStack>
        ) : (
          <>
            <IndexTable
              resourceName={{ singular: 'product', plural: 'products' }}
              itemCount={flatRows.length}
              selectable={false}
              headings={[
                { title: 'Product Title' },
                { title: 'Company' },
                { title: 'Car Name' },
                { title: 'Year' },
                { title: 'Vehicle_Type' },
                { title: 'View' },
                { title: 'Edit' },
              ]}
            >
              {flatRows.map((row, index) => (
                <IndexTable.Row
                  id={`${row.entryId}-${index}`}
                  key={`${row.entryId}-${index}`}
                  position={index}
                >
                  <IndexTable.Cell>
                    <a
                      href={`https://${app?.config?.shop}/admin/products/${row.legacyResourceId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#1a73e8',
                        textDecoration: 'underline',
                        display: 'inline-block',
                        maxWidth: '200px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={row.productTitle}
                    >
                      {row.productTitle.length > 20 ? row.productTitle.slice(0, 20) + '…' : row.productTitle}
                    </a>
                  </IndexTable.Cell>
                  <IndexTable.Cell>{row.make}</IndexTable.Cell>
                  <IndexTable.Cell>{row.model}</IndexTable.Cell>
                  <IndexTable.Cell>{row.year}</IndexTable.Cell>
                  <IndexTable.Cell>
                    {row.vehicleType
                      ? row.vehicleType.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
                      : '-'}
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Button
                      onClick={() =>
                        router.push(`/database/${row.legacyResourceId}/cars`)
                      }
                      size="slim"
                    >
                      View
                    </Button>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Button
                      onClick={() => router.push(`/database/${row.entryId}/edit`)}
                      size="slim"
                      variant="secondary"
                    >
                      Edit
                    </Button>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  hasPrevious={page > 1}
                  onPrevious={() => setPage((prev) => Math.max(prev - 1, 1))}
                  hasNext={page < totalPages}
                  onNext={() => setPage((prev) => prev + 1)}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </Page>
  );
}
