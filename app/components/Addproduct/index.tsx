'use client';

import { GET_PRODUCTS_QUERY } from '@/lib/graphql/queries';
import { useAppBridge } from '@shopify/app-bridge-react';
import {
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
} from '@shopify/polaris';
import {
  CollectionIcon,
  ProductAddIcon,
  SearchListIcon,
} from '@shopify/polaris-icons';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';

type Product = {
  id: string;
  title: string;
};

type ProductEdge = {
  node: Product;
};

export default function ProductTargetSelector() {
  const [selected, setSelected] = useState<'products' | 'collection'>('products');
  const [showForm, setShowForm] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ id: string; title: string; type: string }[]>([]);
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [entries, setEntries] = useState<{ from: string; to: string; make: string; model: string }[]>([]);
const router = useRouter();

  const app = useAppBridge();

  const yearOptions = Array.from({ length: 2025 - 1990 + 1 }, (_, i) => {
    const value = (1990 + i).toString();
    return { label: value, value };
  });

  const Tile = ({
    label,
    icon,
    active,
    onClick,
  }: {
    label: string;
    icon: any;
    active: boolean;
    onClick: () => void;
  }) => (
    <div
      onClick={onClick}
      style={{
        flex: 1,
        border: active ? '2px solid black' : '1px solid #dcdcdc',
        borderRadius: '8px',
        backgroundColor: active ? 'white' : '#f6f6f7',
        padding: '24px 0',
        cursor: 'pointer',
        textAlign: 'center',
      }}
    >
      <Icon source={icon} tone="base" />
      <Text as="p" alignment="center" tone="subdued">
        {label}
      </Text>
    </div>
  );

  useEffect(() => {
    const shop = app?.config?.shop;
    if (!shop) return;

    async function fetchProducts() {
      try {
        const res = await axios.post(`/api/getproduct?shop=${shop}`, {
          query: GET_PRODUCTS_QUERY,
        });

        const productEdges = res.data?.data?.products?.edges as ProductEdge[];
        const productNodes = productEdges?.map((edge) => ({
          id: edge.node.id,
          title: edge.node.title,
        })) || [];

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
  } = useIndexResourceState(products);

  const displayItems = selectedItems.filter((item) => item.type === selected);

  const handleSave = async () => {
  try {
    const shop = app?.config?.shop;
    if (!shop || selectedItems.length === 0 || entries.length === 0) {
      console.error("Missing required data");
      return;
    }

    const payload = entries.map((entry) => ({
      shop,
      year: `${entry.from}-${entry.to}`,
      make: entry.make.trim(),
      model: entry.model.trim(),
      products: selectedItems.map((item) => ({
        productId: item.id,
        title: item.title,
      })),
    }));
    console.log("Payload to save:", payload);
    const res = await axios.post("/api/product/add", payload);
      app.toast?.show('Entry Created successfully!');
      router.push('/database');
    
    console.log("Saved successfully:", res.data);
  } catch (error) {
    console.error("Failed to save:", error);
  }
};


  return (
    <BlockStack gap="400">
      <Card padding="600">
        <BlockStack gap="400">
          <InlineStack gap="400">
            <Tile
              label="Products"
              icon={ProductAddIcon}
              active={selected === 'products'}
              onClick={() => setSelected('products')}
            />
            <Tile
              label="Collection"
              icon={CollectionIcon}
              active={selected === 'collection'}
              onClick={() => setSelected('collection')}
            />
          </InlineStack>

          {displayItems.length === 0 ? (
            <Text as="p" variant="bodyMd" tone="subdued">
              No {selected} associated with the search rule
            </Text>
          ) : (
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">Selected {selected}</Text>
              {displayItems.map((item) => (
                <Text as="p" key={item.id}>{item.title}</Text>
              ))}
            </BlockStack>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              {selected === 'products' ? 'Add Products' : 'Add Collection'}
            </Button>
          </div>
        </BlockStack>
      </Card>

      {!showForm && selectedItems.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button onClick={() => setShowForm(true)}>Save Changes</Button>
        </div>
      )}

      {showForm && (
        <Card padding="400">
          <BlockStack gap="400">
            <InlineStack gap="300" wrap>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <Select
                  label="From Year"
                  options={yearOptions}
                  onChange={(val) =>
                    setYear((prev) => `${val}-${prev.split('-')[1] || val}`)
                  }
                  value={year.split('-')[0] || ''}
                />
              </div>

              <div style={{ flex: 1, minWidth: '150px' }}>
                <Select
                  label="To Year"
                  options={yearOptions}
                  onChange={(val) =>
                    setYear((prev) => `${prev.split('-')[0] || val}-${val}`)
                  }
                  value={year.split('-')[1] || ''}
                />
              </div>

              <div style={{ flex: 1, minWidth: '200px' }}>
                <TextField
                  label="Make"
                  value={make}
                  onChange={setMake}
                  autoComplete="off"
                  placeholder="e.g. Honda"
                />
              </div>

              <div style={{ flex: 1, minWidth: '200px' }}>
                <TextField
                  label="Model"
                  value={model}
                  onChange={setModel}
                  autoComplete="off"
                  placeholder="e.g. Civic"
                />
              </div>

              <div style={{ alignSelf: 'end' }}>
                <Button
                  onClick={() => {
                    const [from, to] = year.split('-');
                    if (from && to && make && model) {
                      setEntries((prev) => [...prev, { from, to, make, model }]);
                      setYear('');
                      setMake('');
                      setModel('');
                    }
                  }}
                >
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
                  ]}
                >
                  {entries.map((item, index) => (
                    <IndexTable.Row id={`${index}`} key={index} position={index}>
                      <IndexTable.Cell>{item.from}</IndexTable.Cell>
                      <IndexTable.Cell>{item.to}</IndexTable.Cell>
                      <IndexTable.Cell>{item.make}</IndexTable.Cell>
                      <IndexTable.Cell>{item.model}</IndexTable.Cell>
                    </IndexTable.Row>
                  ))}
                </IndexTable>
              </Card>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={handleSave}>
                Save
              </Button>
            </div>
          </BlockStack>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Add ${selected}`}
        primaryAction={{
          content: 'Add',
          onAction: () => {
            const selectedData = products.filter((product) =>
              selectedResources.includes(product.id)
            ).map(p => ({
              ...(p as { id: string; title: string }),
              type: selected,
            }));

            setSelectedItems(prev => [
              ...prev.filter(item => item.type !== selected),
              ...selectedData,
            ]);
            setModalOpen(false);
          },
        }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]}
      >
        <Modal.Section>
          <TextField
            label={`Search ${selected}`}
            value={searchTerm}
            onChange={setSearchTerm}
            autoComplete="off"
            prefix={<Icon source={SearchListIcon} tone="base" />}
          />
          <div style={{ marginTop: '16px' }}>
            <IndexTable
              resourceName={{ singular: selected, plural: `${selected}s` }}
              itemCount={filteredProducts.length}
              selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
              onSelectionChange={handleSelectionChange}
              headings={[{ title: selected === 'products' ? 'Product' : 'Collection' }]}
              selectable
            >
              {filteredProducts.map(({ id, title }, index) => (
                <IndexTable.Row
                  id={id}
                  key={id}
                  selected={selectedResources.includes(id)}
                  position={index}
                >
                  <IndexTable.Cell>{title}</IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          </div>
        </Modal.Section>
      </Modal>
    </BlockStack>
  );
}
