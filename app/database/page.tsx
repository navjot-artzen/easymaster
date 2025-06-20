'use client';

import { useAppBridge } from '@shopify/app-bridge-react';
import {
  Page,
  Card,
  IndexTable,
  Text,
  Button,
  Link,
  Icon,
  Spinner,
  BlockStack,
} from '@shopify/polaris';
import { ProductFilledIcon } from '@shopify/polaris-icons';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProductEntry {
  id: string;
  startFrom: string;
  end: string;
  make: string;
  model: string;
  products: {
    gid: string;
    title: string;
  }[];
}

export default function SearchEntryListPage() {
  const [entries, setEntries] = useState<ProductEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const app=useAppBridge()
  useEffect(() => {
      const shop=app?.config?.shop

    const fetchEntries = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/product?shop=${shop}`);
        if (!res.ok) throw new Error('Failed to fetch entries');
        const data: ProductEntry[] = await res.json();
        setEntries(data);
      } catch (error) {
        console.error('Error fetching entries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  return (
    <Page
      title="Search entries & results"
      primaryAction={{
        content: 'Add search entry',
        onAction: () => router.push('/database/create'),
      }}
    >
      <Card>
        {loading ? (
          <BlockStack align="center" inlineAlign="center" gap="400">
            <Spinner accessibilityLabel="Loading entries" size="large" />
          </BlockStack>
        ) : (
          <IndexTable
            resourceName={{ singular: 'entry', plural: 'entries' }}
            itemCount={entries.length}
            headings={[
              { title: 'Year' },
              { title: 'Make' },
              { title: 'Model' },
              { title: 'Attachment' },
            ]}
            selectable={false}
          >
            {entries.map((entry, index) => (
              <IndexTable.Row id={entry.id} key={entry.id} position={index}>
                <IndexTable.Cell>{`${entry.startFrom}-${entry.end}`}</IndexTable.Cell>
                <IndexTable.Cell>{entry.make}</IndexTable.Cell>
                <IndexTable.Cell>{entry.model}</IndexTable.Cell>
                <IndexTable.Cell>
                  <Link url={`/database/${entry.id}/edit`}>
                    {entry.products.length === 1
                      ? '1 product'
                      : `${entry.products.length} products`}
                  </Link>
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        )}
      </Card>
    </Page>
  );
}
