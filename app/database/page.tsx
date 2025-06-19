'use client';

import {
  Page,
  Card,
  IndexTable,
  Text,
  Button,
  Link,
  Icon,
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
  const router = useRouter();

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await fetch('/api/product');
        if (!res.ok) throw new Error('Failed to fetch entries');
        const data: ProductEntry[] = await res.json();
        setEntries(data);
      } catch (error) {
        console.error('Error fetching entries:', error);
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
      </Card>
    </Page>
  );
}
