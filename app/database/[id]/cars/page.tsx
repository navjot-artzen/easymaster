'use client';
import { ConfirmModal } from '@/app/components/ConfirmBox';
import { CarEntry } from '@/types/interfaces';
import { LIMIT } from '@/utils/config/constant';
import { useAppBridge } from '@shopify/app-bridge-react';
import {
  Page,
  IndexTable,
  Spinner,
  BlockStack,
  Text,
  InlineStack,
  Pagination,
  Button,
  Tooltip,
} from '@shopify/polaris';
import { DeleteIcon, EditIcon } from '@shopify/polaris-icons';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProductCarsPage() {
  const { id } = useParams();
  const [entries, setEntries] = useState<CarEntry[]>([]);
  const [productTitle, setProductTitle] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState<number>();
  const router = useRouter();
  const app = useAppBridge();

  // ✅ Moved fetchCars outside useEffect for reuse
  const fetchCars = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/product/${id}/cars?page=${currentPage}&pageSize=${LIMIT}`);
      if (!res.ok) throw new Error('Failed to fetch product cars');
      const data = await res.json();
      setEntries(data.entries || []);
      setProductTitle(data.productTitle || null);
      setTotalCount(data.totalCount);
      setTotalPages(Math.ceil(data.totalCount / LIMIT));
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCars();
  }, [id, currentPage]);

  const normalize = (str: string) => str?.toLowerCase().replace(/[\s-]/g, '');

  const filteredEntries = entries.filter((entry) => {
    if (filterType === 'ALL') return true;
    return normalize(entry.driveType || '') === normalize(filterType);
  });

  const handleDelete = async (entryId: string) => {
    const shop = (app as any)?.config?.shop;

    try {
      const res = await fetch(`/api/product/${entryId}?legacyResourceId=${id}&shop=${shop}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchCars(); // ✅ Re-fetch table data after delete
      } else {
        console.error('Failed to delete product from entry');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleEdit = (entry: CarEntry) => {
    router.push(`/database/${entry.id}/edit`);
  };

  return (
    <Page
      fullWidth
      title={productTitle || 'Product Cars'}
      backAction={{ content: 'Back', onAction: () => router.push('/database') }}
    >
      <BlockStack gap="400">
        <InlineStack align="end">
          <Button
            variant="primary"
            onClick={() => router.push(`/database/addymmbyproduct?legacyId=${id}`)}
          >
            Add YMM Entry
          </Button>
        </InlineStack>

        {loading ? (
          <BlockStack align="center" inlineAlign="center" gap="400">
            <Spinner accessibilityLabel="Loading cars" size="large" />
          </BlockStack>
        ) : filteredEntries.length === 0 ? (
          <Text as="p">No matching vehicles found for this product.</Text>
        ) : (
          <>
            <IndexTable
              resourceName={{ singular: 'Car', plural: 'Cars' }}
              itemCount={filteredEntries.length}
              headings={[
                { title: 'Year' },
                { title: 'Make' },
                { title: 'Model' },
                { title: 'Drive_Type' },
                { title: 'Engine_Type' },
                { title: 'Actions' }
              ]}
              selectable={false}
            >
              {filteredEntries.map((entry, index) => (
                <IndexTable.Row id={entry.id} key={entry.id} position={index}>
                  <IndexTable.Cell>{`${entry.startFrom} - ${entry.end}`}</IndexTable.Cell>
                  <IndexTable.Cell>{entry.make}</IndexTable.Cell>
                  <IndexTable.Cell>{entry.model}</IndexTable.Cell>
                  <IndexTable.Cell>
                    {entry.driveType
                      ? entry.driveType.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
                      : '-'}
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    {entry.engineType || '-'}
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <InlineStack gap="200">
                      <Tooltip content="Edit this YMM entry">
                        <Button size='slim' icon={EditIcon} onClick={() => handleEdit(entry)} />

                      </Tooltip>
                      {/* <Button
                        icon={DeleteIcon}
                        tone="critical"
                        onClick={() => handleDelete(entry.id)}
                      /> */}
                      <ConfirmModal
                        modalTitle="Delete this file?"
                        message="Are you sure you want to permanently delete this file?"
                        destructive
                        onConfirm={() => handleDelete(entry.id)}
                      >
                        <Tooltip content="Delete this YMM entry">
                          <Button

                            size="slim"
                            tone="critical"
                            variant="tertiary"
                            icon={DeleteIcon}
                          />
                        </Tooltip>

                      </ConfirmModal>
                    </InlineStack>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>

            {totalPages > 1 && (
              <InlineStack align="center" blockAlign="center">
                <Pagination
                  hasPrevious={currentPage > 1}
                  onPrevious={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  hasNext={currentPage < totalPages}
                  onNext={() => setCurrentPage((p) => p + 1)}
                />
              </InlineStack>
            )}

            <div style={{ marginTop: '12px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> | Showing <strong>{entries.length}</strong> of <strong>{totalCount}</strong> total entries
            </div>
          </>
        )}
      </BlockStack>
    </Page>
  );
}
