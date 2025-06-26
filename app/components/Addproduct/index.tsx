'use client';

import { GET_PRODUCTS_QUERY } from '@/lib/graphql/queries';
import { useAppBridge } from '@shopify/app-bridge-react';
import {
  Page,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Icon,
  Select,
  TextField,
  Modal,
  IndexTable,
  useIndexResourceState,
  FormLayout,
} from '@shopify/polaris';
import {
  DeleteIcon,
  EditIcon,
  SearchListIcon,
} from '@shopify/polaris-icons';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';

interface Product {
  id: string;
  title: string;
  type?: string;
  [key: string]: unknown; // ✅ index signature to satisfy Polaris type
}

interface Entry {
  from: string;
  to: string;
  make: string;
  model: string;
  vehicleType: string;
}

interface ValidationErrors {
  yearFrom?: string;
  yearTo?: string;
  make?: string;
  model?: string;
  vehicleType?: string;
}
export default function ProductTargetSelector() {
  const [selectedItems, setSelectedItems] = useState<Product[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [vehicleType, setVehicleType] = useState<'2-wheeler' | '4-wheeler'>('2-wheeler');
  const [isSaving, setIsSaving] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const router = useRouter();
  const app = useAppBridge();

  const yearOptions = Array.from({ length: 2025 - 1990 + 1 }, (_, i) => {
    const value = (1990 + i).toString();
    return { label: value, value };
  });

  const vehicleTypeOptions = [
    { label: '2-wheeler', value: '2-wheeler' },
    { label: '4-wheeler', value: '4-wheeler' },
  ];

 const validateFields = (): boolean => {
  const errors: ValidationErrors = {};
  const [from, to] = year.split('-');

  if (!from) errors.yearFrom = 'Select from year';
  if (!to) errors.yearTo = 'Select to year';

  const fromYear = parseInt(from, 10);
  const toYear = parseInt(to, 10);

  if (from && to && fromYear > toYear) {
    errors.yearFrom = 'From year must be less than or equal to To year';
    errors.yearTo = 'To year must be greater than or equal to From year';
  }

  if (!make.trim()) errors.make = 'Enter make';
  if (!model.trim()) errors.model = 'Enter model';
  if (!vehicleType) errors.vehicleType = 'Select vehicle type';

  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};


  const handleAddEntry = () => {
    if (!validateFields()) return;
    const [from, to] = year.split('-');
    setEntries((prev) => [...prev, { from, to, make, model, vehicleType }]);
    setYear('');
    setMake('');
    setModel('');
    setVehicleType('2-wheeler');
    setValidationErrors({});
  };

  const handleEditSave = () => {
    if (!validateFields()) return;
    const [from, to] = year.split('-');
    const updated: Entry = { from, to, make, model, vehicleType };
    setEntries((prev) => prev.map((e, i) => (i === editIndex ? updated : e)));
    setEditModalOpen(false);
    setEditIndex(null);
    setYear('');
    setMake('');
    setModel('');
    setVehicleType('2-wheeler');
    setValidationErrors({});
  };

  const openEditModal = (index: number) => {
    const item = entries[index];
    setYear(`${item.from}-${item.to}`);
    setMake(item.make);
    setModel(item.model);
    setVehicleType(item.vehicleType as '2-wheeler' | '4-wheeler');
    setEditIndex(index);
    setEditModalOpen(true);
  };

  const handleSave = () => {
    if (!validateFields()) return;
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  useEffect(() => {
    const shop = (app as any)?.config?.shop;
    if (!shop) return;

    async function fetchProducts() {
      try {
        const res = await axios.post(`/api/getproduct?shop=${shop}`, {
          query: GET_PRODUCTS_QUERY,
        });
        const productEdges = res.data?.data?.products?.edges || [];
        const productNodes: Product[] = productEdges.map((edge: any) => ({
          id: edge.node.id,
          title: edge.node.title,
        }));
        setProducts(productNodes);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    }

    fetchProducts();
  }, [app]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
  } = useIndexResourceState<Product>(products);


  return (
    <Page
      title="Product Target Selector"
      backAction={{ content: 'Back', onAction: () => router.push('/database') }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <BlockStack gap="400">
          <Card padding="600">
            <BlockStack gap="400">
              <Text as='p' variant="headingSm">Selected Products</Text>
              {selectedItems.length === 0 ? (
                <Text as='p' tone="subdued">No products associated with the search rule</Text>
              ) : (
                selectedItems.map((item) => (
                  <Text as='p' key={item.id}>{item.title}</Text>
                ))
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button onClick={() => setModalOpen(true)} disabled={showForm}>
                  {selectedItems.length > 0 ? 'Add More Products' : 'Add Products'}
                </Button>
                {!showForm && selectedItems.length > 0 && (
                  <Button onClick={() => setShowForm(true)} variant="primary" size="slim">
                    Continue
                  </Button>
                )}
              </div>
            </BlockStack>
          </Card>

          {showForm && (
            <Card padding="400">
              <BlockStack gap="200">
                <InlineStack gap="300" wrap={false}>
                  <div style={{ minWidth: '120px' }}>
                    <Select label="From Year" options={yearOptions} value={year.split('-')[0] || ''} onChange={(val) => setYear(`${val}-${year.split('-')[1] || val}`)} error={validationErrors.yearFrom} />
                  </div>
                  <div style={{ minWidth: '120px' }}>
                    <Select label="To Year" options={yearOptions} value={year.split('-')[1] || ''} onChange={(val) => setYear(`${year.split('-')[0] || val}-${val}`)} error={validationErrors.yearTo} />
                  </div>
                  <div style={{ minWidth: '110px' }}>
                    <TextField label="Make" value={make} onChange={setMake} autoComplete="off" placeholder="e.g. Honda" error={validationErrors.make} />
                  </div>
                  <div style={{ minWidth: '110px' }}>
                    <TextField label="Model" value={model} onChange={setModel} autoComplete="off" placeholder="e.g. Civic" error={validationErrors.model} />
                  </div>
                  <div style={{ minWidth: '120px' }}>
                    <Select label="Vehicle Type" options={vehicleTypeOptions} value={vehicleType} onChange={(selected) => setVehicleType(selected as '2-wheeler' | '4-wheeler')} error={validationErrors.vehicleType} />
                  </div>
                  <div style={{ display: 'flex', alignItems: Object.keys(validationErrors).length === 0 ? 'flex-end' : '' }}>
                    <Button onClick={handleAddEntry} size="slim" variant="tertiary">
                      Add More
                    </Button>
                  </div>
                </InlineStack>

                {entries.length > 0 && (
                  <Card>
                    <IndexTable
                      resourceName={{ singular: 'entry', plural: 'entries' }}
                      itemCount={entries.length}
                      headings={[
                        { title: 'From' },
                        { title: 'To' },
                        { title: 'Make' },
                        { title: 'Model' },
                        { title: 'Vehicle Type' },
                        { title: 'Actions' },
                      ]}
                    >
                      {entries.map((item, index) => (
                        <IndexTable.Row id={`${index}`} key={index} position={index}>
                          <IndexTable.Cell>{item.from}</IndexTable.Cell>
                          <IndexTable.Cell>{item.to}</IndexTable.Cell>
                          <IndexTable.Cell>{item.make}</IndexTable.Cell>
                          <IndexTable.Cell>{item.model}</IndexTable.Cell>
                          <IndexTable.Cell>{item.vehicleType}</IndexTable.Cell>
                          <IndexTable.Cell>
                            <InlineStack>
                              <Button icon={EditIcon} variant="tertiary" onClick={() => openEditModal(index)} />
                              <Button icon={DeleteIcon} variant="tertiary" onClick={() => setEntries((prev) => prev.filter((_, i) => i !== index))} />
                            </InlineStack>
                          </IndexTable.Cell>
                        </IndexTable.Row>
                      ))}
                    </IndexTable>
                  </Card>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="primary" onClick={handleSave} disabled={isSaving} loading={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </BlockStack>
            </Card>
          )}

          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Add Products"
            primaryAction={{
              content: 'Add',
              onAction: () => {
                const selectedData = products
                  .filter((product) => selectedResources.includes(product.id))
                  .map((p) => ({ ...p, type: 'products' }));
                setSelectedItems((prev) => [
                  ...prev.filter((item) => item.type !== 'products'),
                  ...selectedData,
                ]);
                setModalOpen(false);
              },
            }}
            secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]}
          >
            <Modal.Section>
              <TextField
                label="Search Products"
                value={searchTerm}
                onChange={setSearchTerm}
                autoComplete="off"
                prefix={<Icon source={SearchListIcon} tone="base" />}
              />
              <div style={{ marginTop: '16px' }}>
                <IndexTable
                  resourceName={{ singular: 'product', plural: 'products' }}
                  itemCount={filteredProducts.length}
                  selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
                  onSelectionChange={handleSelectionChange}
                  headings={[{ title: 'Product' }]}
                  selectable
                >
                  {filteredProducts.map(({ id, title }, index) => (
                    <IndexTable.Row id={id} key={id} selected={selectedResources.includes(id)} position={index}>
                      <IndexTable.Cell>
                        <span style={{
                          display: 'inline-block',
                          maxWidth: '200px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          verticalAlign: 'middle',
                        }}>
                          {title}
                        </span>
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  ))}
                </IndexTable>
              </div>
            </Modal.Section>
          </Modal>

          <Modal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            title="Edit Entry"
            primaryAction={{ content: 'Update', onAction: handleEditSave }}
            secondaryActions={[{ content: 'Cancel', onAction: () => setEditModalOpen(false) }]}
          >
            <Modal.Section>
              <FormLayout>
                <Select label="From Year" options={yearOptions} value={year.split('-')[0] || ''} onChange={(val) => setYear(`${val}-${year.split('-')[1] || val}`)} error={validationErrors.yearFrom} />
                <Select label="To Year" options={yearOptions} value={year.split('-')[1] || ''} onChange={(val) => setYear(`${year.split('-')[0] || val}-${val}`)} error={validationErrors.yearTo} />
                <TextField label="Make" value={make} onChange={setMake} error={validationErrors.make} autoComplete="off"
                />
                <TextField label="Model" value={model} onChange={setModel} error={validationErrors.model} autoComplete="off"
                />
                <Select label="Vehicle Type" options={vehicleTypeOptions} value={vehicleType} onChange={(selected) => setVehicleType(selected as '2-wheeler' | '4-wheeler')} error={validationErrors.vehicleType} />
              </FormLayout>
            </Modal.Section>
          </Modal>
        </BlockStack>
      </div>
    </Page>
  );
}