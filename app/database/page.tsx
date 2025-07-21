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

  const [makesData, setMakesData] = useState<any[]>([]);
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [modelsForMake, setModelsForMake] = useState<any[]>([]);

  const router = useRouter();
  const app = useAppBridge();

  // Fetch entries based on filters
  useEffect(() => {
    const shop = app?.config?.shop;
    setShop(shop);
    if (!shop) return;

    const fetchEntries = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          shop,
          page: page.toString(),
          limit,
        });
        if (selectedMake) params.append('make', selectedMake);
        if (selectedModel) params.append('model', selectedModel);

        const res = await fetch(`/api/product?${params.toString()}`);
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
  }, [app, page, limit, selectedMake, selectedModel]);

  // Fetch Make-Model list
  useEffect(() => {
    const fetchMakeModel = async () => {
      try {
        const res = await fetch('/api/make-model');
        const data = await res.json();
        if (data?.makes) {
          setMakesData(data.makes);
        }
      } catch (err) {
        console.error('Error fetching makes/models', err);
      }
    };
    fetchMakeModel();
  }, []);

  const handleLimitChange = (value: string) => {
    setLimit(value);
    setPage(1);
  };

  const handleMakeChange = (makeName: string) => {
    setSelectedMake(makeName);
    setSelectedModel('');
    setPage(1); // Reset page on filter
    const selected = makesData.find((m) => m.name === makeName);
    setModelsForMake(selected?.models || []);
  };

  const handleModelChange = (modelName: string) => {
    setSelectedModel(modelName);
    setPage(1); // Reset page on filter
  };

  const totalPages = Math.ceil(totalCount / Number(limit));
  if (!shop) return null;

  return (
    <Page
      fullWidth
      title="Search entries & results"
      primaryAction={
        <InlineStack align="end" gap="400">
          {/* Pagination limit */}
          <Select
            label="Show"
            labelInline
            options={limitOptions}
            value={limit}
            onChange={handleLimitChange}
          />

          {/* Make Filter */}
          <Select
            label=""
            labelInline
            options={[{ label: 'All Makes', value: '' }, ...makesData.map((m) => ({ label: m.name, value: m.name }))]}
            value={selectedMake}
            onChange={handleMakeChange}
          />

          {/* Model Filter */}
          <Select
            label=""
            disabled={!selectedMake}
            labelInline
            options={[{ label: 'All Models', value: '' }, ...modelsForMake.map((m) => ({ label: m.name, value: m.name }))]}
            value={selectedModel}
            onChange={handleModelChange}
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
        flatRows={entries}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
        totalCount={totalCount}
        entriesCount={entries.length}
        shop={shop}
        limit={Number(limit)}
      />
    </Page>
  );
}
