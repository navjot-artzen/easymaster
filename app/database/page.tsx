'use client';

import { FlatProductRow } from '@/types/interfaces';
import { LIMIT } from '@/utils/config/constant';
import { useAppBridge } from '@shopify/app-bridge-react';
import {
  Page,
  Button,
  InlineStack,
  Select,
  BlockStack,
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProductDatabaseTable } from '../components/TableCard/ProductDatabase';

const limitOptions = [
  { label: '10', value: '10' },
  { label: '25', value: '25' },
  { label: '50', value: '50' },
  { label: '100', value: '100' },
];

export default function SearchEntryListPage() {
  const [entries, setEntries] = useState<FlatProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [shop, setShop] = useState<string | undefined>();
  const [limit, setLimit] = useState('25');

  const router = useRouter();
  const app = useAppBridge();

  useEffect(() => {
    const shop = app?.config?.shop;
    setShop(shop);
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
  }, [app, page, limit]);

  const handleLimitChange = (value: string) => {
    setLimit(value);
    setPage(1); // reset to page 1 when limit changes
  };

  const flatRows = entries || [];
  const totalPages = Math.ceil(totalCount / Number(limit));
  if (!shop) return null;

  return (
    <Page
      fullWidth
      title="Search entries & results"
      primaryAction={
        <InlineStack align="end" gap="400">
          <Select
            label="Show"
            labelInline
            options={limitOptions}
            value={limit}
            onChange={handleLimitChange}
          />
          <Button onClick={() => router.push('/database/upload-csv')}>Upload CSV</Button>
          <Button onClick={() => router.push('/database/create')} variant="primary">
            Add search entry
          </Button>
        </InlineStack>
      }
    >
      <ProductDatabaseTable
        loading={loading}
        flatRows={flatRows}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
        totalCount={totalCount}
        entriesCount={entries.length}
        shop={shop}
        limit={Number(limit)} // pass this
      />

    </Page>
  );
}
