'use client';

import { useAppBridge } from '@shopify/app-bridge-react';
import {
  Page,
  Card,
  TextField,
  IndexTable,
  Spinner,
  Text,
  Button,
  InlineStack,
  Icon,
  Tooltip,
} from '@shopify/polaris';
import {
  DeleteIcon,
  EditIcon,
  InfoIcon,
  LockIcon,
  MinusIcon,
} from '@shopify/polaris-icons';
import { useState } from 'react';
import { Product } from '@/types/interfaces';
import { useRouter } from 'next/navigation';
import { EditModal } from '../components/Modal/EditModal';
import { formatEngineOptions } from '@/utils/helper';
import axios from 'axios';

interface VehicleEntry {
  make: string;
  model: string;
  years: string;
  engineOptions?: string;
  drive?: string;
  note?: string;
  locked?: boolean;
  products?: Product[];
}

export default function SearchTablePage() {
  const [inputValue, setInputValue] = useState('');
  const [note, setNote] = useState('');
  const [inputError, setInputError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [tableData, setTableData] = useState<VehicleEntry[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState({
    make: '',
    model: '',
    years: '',
    engineOptions: '',
    drive: '',
    note: '',
  });
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [lockedEntries, setLockedEntries] = useState<VehicleEntry[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);

  const app = useAppBridge();
  const router = useRouter();

  const normalizeYear = (year: string) =>
    year.replace(/[–—−]/g, '-').replace(/\s+/g, '');

  const handleEdit = (index: number) => {
  const entry = tableData[index];
  setEditIndex(index);
  setEditData({
    make: entry.make,
    model: entry.model,
    years: entry.years,
    engineOptions: formatEngineOptions(entry.engineOptions) || '',
    drive: entry.drive || '',
    note: entry.note || '',
  });
  setEditModalOpen(true);
};

  const handleUpdateEntry = (updated: {make: string;
  model: string;
  years: string;
  engineOptions?: string;
  drive?: string;
  note?: string;}) => {
    if (editIndex === null) return;
    const normalized = {
      ...updated,
      years: normalizeYear(updated.years),
      engineOptions: formatEngineOptions(updated.engineOptions),
    };
    setTableData((prev) =>
      prev.map((entry, i) => (i === editIndex ? normalized : entry))
    );
    setEditModalOpen(false);
    setEditIndex(null);
  };

  const handleClear = () => {
    setInputValue('');
    setNote('');
    setTableData([]);
    setClicked(false);
    setInputError(undefined);
    setSelectedProducts([]);
  };

  const handleSubmit = async () => {
    const trimmedPart = inputValue.trim();

    if (!trimmedPart) {
      setInputError('Part number is required');
      return;
    } else {
      setInputError(undefined);
    }

    setClicked(true);
    setLoading(true);

    try {
      const response = await fetch('/api/search-parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partNumber: trimmedPart, note: note }),
      });

      const result = await response.json();
      const normalizedData = (result.compatibleVehicles || []).map(
        (entry: VehicleEntry) => ({
          ...entry,
          years: normalizeYear(entry.years),
        })
      );

      const mergedData = [...lockedEntries, ...normalizedData].filter(
        (entry, index, self) =>
          index ===
          self.findIndex(
            (e) =>
              e.make === entry.make &&
              e.model === entry.model &&
              e.years === entry.years
          )
      );

      setTableData(mergedData);
    } catch (err) {
      console.error('Search error:', err);
      setTableData(lockedEntries);
    }

    setLoading(false);
  };

  const handleDelete = (index: number) => {
    if (
      tableData[index]?.locked &&
      !confirm('This entry is locked. Unlock before deleting. Proceed?')
    )
      return;

    if (confirm('Are you sure you want to delete this entry?')) {
      setTableData((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    const shop = (app as any)?.config?.shop;
    if (!shop) return;

    setSaveLoading(true);

    const payload = tableData.map((entry) => ({
      year: normalizeYear(entry.years),
      make: entry.make,
      model: entry.model,
      engineType: formatEngineOptions(entry.engineOptions),
      driveType: entry.drive,
      note: entry.note,
      products: selectedProducts.map((p) => ({
        title: p.title,
        productId: p.id,
      })),
      shop,
    }));

    try {
      const res = await axios.post('/api/product/add', payload);
      if (res.status === 200) {
        app.toast?.show('Data saved successfully');
        router.push('/database');
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleLock = (index: number) => {
    const updated = [...tableData];
    updated[index].locked = !updated[index].locked;

    const locked = updated.filter((entry) => entry.locked);
    const unlocked = updated.filter((entry) => !entry.locked);

    setLockedEntries(locked);
    setTableData([...locked, ...unlocked]);
  };

  const selectProducts = async () => {
    try {
      const initialSelection = selectedProducts.map((product) => ({
        id: product.id,
        type: 'product',
      }));

      const { selection }: any = await window.shopify.resourcePicker({
        type: 'product',
        multiple: false,
        action: 'select',
        selectionIds: initialSelection,
      });

      const updated = selection.map((product: any) => ({
        id: product.id,
        title: product.title,
        legacyResourceId: product.legacyResourceId,
      }));

      setSelectedProducts(updated);
    } catch (error) {
      console.error('Error selecting products:', error);
    }
  };

  return (
    <Page fullWidth title="Search Compatible Vehicle by Part Number">
      <div style={{ display: 'flex', justifyContent: 'start' }}>
        <div style={{ maxWidth: 1000, width: '100%' }}>
          <Card>
            <InlineStack align="start" gap="200" wrap={false}>
              <div style={{ flexGrow: 1 }}>
                <TextField
                  label="Part Number"
                  value={inputValue}
                  onChange={(value) => {
                    setInputValue(value);
                    if (inputError && value.trim()) setInputError(undefined);
                  }}
                  autoComplete="off"
                  placeholder="Enter part number"
                  error={inputError}
                />
              </div>
              <div style={{ flexGrow: 1 }}>
                <TextField
                  label="Note"
                  value={note}
                  onChange={setNote}
                  placeholder="Add a note (optional)"
                  autoComplete="off"
                />
              </div>
              <div style={{ alignSelf: 'flex-start', marginTop: '23px' }}>
                <Button onClick={handleSubmit}>Search</Button>
              </div>
              <div style={{ alignSelf: 'flex-start', marginTop: '23px' }}>
                <Button tone="critical" onClick={handleClear}>
                  Clear
                </Button>
              </div>
            </InlineStack>
          </Card>

          <div style={{ height: '24px' }} />

          {loading && (
            <Card>
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <Spinner accessibilityLabel="Loading" size="large" />
              </div>
            </Card>
          )}

          {!loading && tableData.length > 0 && (
            <>
              <Card>
                <IndexTable
                  resourceName={{ singular: 'part', plural: 'parts' }}
                  itemCount={tableData.length}
                  headings={[
                    { title: 'Make' },
                    { title: 'Model' },
                    { title: 'Year' },
                    { title: 'Engine Type' },
                    { title: 'Drive Type' },
                    { title: 'Notes' },
                    { title: 'Actions' },
                  ]}
                  selectable={false}
                >
                  {tableData.map((part, index) => (
                    <IndexTable.Row
                      id={index.toString()}
                      key={index}
                      position={index}
                    >
                      <IndexTable.Cell>{part.make}</IndexTable.Cell>
                      <IndexTable.Cell>{part.model}</IndexTable.Cell>
                      <IndexTable.Cell>{part.years}</IndexTable.Cell>
                      <IndexTable.Cell>
                        {formatEngineOptions(part.engineOptions)}
                      </IndexTable.Cell>
                      <IndexTable.Cell>{part.drive || '-'}</IndexTable.Cell>
                      <IndexTable.Cell>
                        {part.note ? (
                          <Tooltip content={part.note}>
                            <Icon source={InfoIcon} tone="base" />
                          </Tooltip>
                        ) : (
                          '-'
                        )}
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        <InlineStack gap="200">
                          <Button
                            icon={<Icon source={EditIcon} tone="base" />}
                            onClick={() => handleEdit(index)}
                            size="slim"
                          />
                          <Button
                            icon={<Icon source={DeleteIcon} tone="critical" />}
                            onClick={() => handleDelete(index)}
                            size="slim"
                          />
                          <Button
                            icon={
                              <Icon
                                source={
                                  part.locked ? MinusIcon : LockIcon
                                }
                              />
                            }
                            onClick={() => toggleLock(index)}
                            size="slim"
                          />
                        </InlineStack>
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  ))}
                </IndexTable>
              </Card>

              <div style={{ marginTop: '16px', textAlign: 'left' }}>
                <Button onClick={selectProducts}>
                  {selectedProducts.length > 0
                    ? 'Replace Products'
                    : 'Add Products'}
                </Button>
              </div>

              {selectedProducts.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <strong>Selected Products:</strong>
                  <ul style={{ marginTop: '4px' }}>
                    {selectedProducts.map((product) => (
                      <li key={product.legacyResourceId || product.id}>
                        {product.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedProducts.length > 0 && (
                <div style={{ marginTop: '16px', textAlign: 'right' }}>
                  <Button
                    onClick={handleSave}
                    variant="primary"
                    disabled={saveLoading}
                    loading={saveLoading}
                  >
                    {saveLoading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </>
          )}

          {!loading && clicked && tableData.length === 0 && (
            <Card>
              <div style={{ padding: '16px' }}>
                <Text as="p" tone="subdued">
                  No results found.
                </Text>
              </div>
            </Card>
          )}
        </div>
      </div>

      <EditModal
  open={editModalOpen}
  initialData={editData}
  onClose={() => {
    setEditModalOpen(false);
    setEditIndex(null);
  }}
  onSave={handleUpdateEntry}
/>
    </Page>
  );
}
