'use client';

import { FlatProductRow } from '@/types/interfaces';
import {
  Card,
  IndexTable,
  Spinner,
  BlockStack,
  Button,
  Pagination,
  Tooltip,
  Icon,
  InlineStack,
} from '@shopify/polaris';
import { InfoIcon } from '@shopify/polaris-icons';
import { useRouter } from 'next/navigation';

interface Props {
  loading: boolean;
  flatRows: FlatProductRow[];
  totalPages: number;
  page: number;
  setPage: (page: number) => void;
  totalCount: number;
  entriesCount: number;
  shop: string;
}

export function ProductDatabaseTable({
  loading,
  flatRows,
  totalPages,
  page,
  setPage,
  totalCount,
  entriesCount,
  shop,
}: Props) {
  const router = useRouter();

  return (
    <Card>
      {loading ? (
        <BlockStack align="center" inlineAlign="center" gap="400">
          <Spinner accessibilityLabel="Loading entries" size="large" />
        </BlockStack>
      ) : (
        <>
          <div style={{ minHeight: '300px', minWidth: 'full' }}>
            <IndexTable
              resourceName={{ singular: 'product', plural: 'products' }}
              itemCount={flatRows.length}
              selectable={false}
              headings={[
                { title: 'Product Title' },
                { title: 'Company' },
                { title: 'Car Name' },
                { title: 'Year' },
                { title: 'Engine_Type' },
                { title: 'Drive_Type' },
                { title: 'Note' },
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
                      href={`https://${shop}/admin/products/${row.legacyResourceId}`}
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
                      {row.productTitle.length > 20
                        ? row.productTitle.slice(0, 20) + '…'
                        : row.productTitle}
                    </a>
                  </IndexTable.Cell>
                  <IndexTable.Cell>{row.make}</IndexTable.Cell>
                  <IndexTable.Cell>{row.model}</IndexTable.Cell>
                  <IndexTable.Cell>{row.year}</IndexTable.Cell>
                  <IndexTable.Cell>
                    {Array.isArray(row.engineType)
                      ? row.engineType.join(', ')
                      : row.engineType || '-'}
                  </IndexTable.Cell>                  <IndexTable.Cell>
                    {row.driveType
                      ? row.driveType.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
                      : '-'}
                  </IndexTable.Cell>
                  <InlineStack align='center' gap='050'>
                    <IndexTable.Cell>
                      {row.note ? (
                        <Tooltip content={row.note}>
                          <Icon source={InfoIcon} tone="base" />
                        </Tooltip>
                      ) : (
                        '-'
                      )}
                    </IndexTable.Cell>
                  </InlineStack>


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
                      onClick={() =>
                        router.push(`/database/${row.entryId}/edit`)
                      }
                      size="slim"
                      variant="secondary"
                    >
                      Edit
                    </Button>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Pagination
                hasPrevious={page > 1}
                onPrevious={() => setPage(Math.max(page - 1, 1))}
                hasNext={page < totalPages}
                onNext={() => setPage(page + 1)}
              />
            </div>
          )}

          <div
            style={{
              marginTop: '12px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px',
            }}
          >
            Page <strong>{page}</strong> of <strong>{totalPages}</strong> | Showing{' '}
            <strong>{entriesCount}</strong> of <strong>{totalCount}</strong> total entries
          </div>
        </>
      )}
    </Card>
  );
}
