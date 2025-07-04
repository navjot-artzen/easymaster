'use client';

import { FlatProductRow } from '@/types/interfaces';
import { LIMIT } from '@/utils/config/constant';
import { useAppBridge } from '@shopify/app-bridge-react';
import {
  Page,
  Button,
  InlineStack,
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProductDatabaseTable } from '../components/TableCard/ProductDatabase';

export default function SearchEntryListPage() {
  const [entries, setEntries] = useState<FlatProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [shop, setShop] = useState<string | undefined>()

  const router = useRouter();
  const app = useAppBridge();

  useEffect(() => {
    const shop = app?.config?.shop;
    setShop(shop)
    if (!shop) return;

    const fetchEntries = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/product?shop=${shop}&page=${page}&limit=${LIMIT}`);
        if (!res.ok) throw new Error('Failed to fetch entries');
        const { entries, totalCount } = await res.json();
        console.log(entries, totalCount, "entries, totalCount ")
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
  console.log(entries, page, "entries, page ")
  const flatRows = entries || []
  // const flatRows: FlatProductRow[] = entries.flatMap((entry) =>
  //   entry.products.map((product) => ({
  //     entryId: entry.id,
  //     productTitle: product.title,
  //     make: entry.make,
  //     model: entry.model,
  //     year: `${entry.startFrom} - ${entry.end}`,
  //     legacyResourceId: product.legacyResourceId,
  //     driveType: entry.driveType || 'ALL',
  //   }))
  // );

  const totalPages = Math.ceil(totalCount / LIMIT);
  if (!shop) return null;

  return (
    <Page
    fullWidth
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
      <ProductDatabaseTable
        loading={loading}
        flatRows={flatRows}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
        totalCount={totalCount}
        entriesCount={entries.length}
        shop={shop}
      />
    </Page>
  );
}
