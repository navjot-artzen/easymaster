'use client';

import { useAppBridge } from '@shopify/app-bridge-react';
import {
  Page,
  Card,
  IndexTable,
  Spinner,
  BlockStack,
  Button,
  Select,
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
  const [entries, setEntries] = useState<ProductEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const router = useRouter();
  const app = useAppBridge();

  const normalize = (str: string) => str?.toLowerCase().replace(/[\s-]/g, '');

  useEffect(() => {
    const shop = app?.config?.shop;
    if (!shop) return;

    const fetchEntries = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/product?shop=${shop}&page=${page}&limit=${limit}`);
        if (!res.ok) throw new Error('Failed to fetch entries');
        const { entries, totalCount } = await res.json();
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

  const flatRows: FlatProductRow[] = entries.flatMap((entry) =>
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

  const filteredRows = flatRows.filter((row) => {
    if (filterType === 'ALL') return true;
    return normalize(row.vehicleType || '') === normalize(filterType);
  });

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
    > {/* <div style={{ maxWidth: 250, marginBottom: 16 }}>
        <Select
          label="Filter by Vehicle Type"
          options={[
            { label: 'All', value: 'ALL' },
            { label: '2 Wheeler', value: '2 Wheeler' },
            { label: '4 Wheeler', value: '4-wheeler' },
          ]}
          onChange={(value) => setFilterType(value)}
          value={filterType}
        />
      </div> */}

      <Card>
        {loading ? (
          <BlockStack align="center" inlineAlign="center" gap="400">
            <Spinner accessibilityLabel="Loading entries" size="large" />
          </BlockStack>
        ) : (
          <>
            <IndexTable
              resourceName={{ singular: 'product', plural: 'products' }}
              itemCount={filteredRows.length}
              selectable={false}
              headings={[
                { title: 'Product Title' },
                { title: 'Company' },
                { title: 'Car Name' },
                { title: 'Year' },
                { title: 'View' },
                { title: 'Edit' },
              ]}
            >
              {filteredRows.map((row, index) => (
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
                      style={{ color: '#1a73e8', textDecoration: 'underline' }}
                    >
                      {row.productTitle}
                    </a>
                  </IndexTable.Cell>
                  <IndexTable.Cell>{row.make}</IndexTable.Cell>
                  <IndexTable.Cell>{row.model}</IndexTable.Cell>
                  <IndexTable.Cell>{row.year}</IndexTable.Cell>
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
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
              <Pagination
                hasPrevious={page > 1}
                onPrevious={() => setPage((prev) => Math.max(prev - 1, 1))}
                hasNext={page < totalPages}
                onNext={() => setPage((prev) => prev + 1)}
              />
            </div>
          </>
        )}
      </Card>
    </Page>
  );
}
