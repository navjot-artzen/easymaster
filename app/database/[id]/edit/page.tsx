"use client";

import {
  Page, Card, TextField, Select, BlockStack, InlineStack, Icon, Tabs,
  IndexTable, Text, Button, Modal, Spinner
} from '@shopify/polaris';
import { ProductAddIcon, SearchListIcon, DeleteIcon } from '@shopify/polaris-icons';
import { useAppBridge } from '@shopify/app-bridge-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { GET_PRODUCTS_QUERY } from '@/lib/graphql/queries';
import { useIndexResourceState } from '@shopify/polaris';

interface Product {
  id: string;
  title: string;
  legacyResourceId: string;
  gid: string;
  [key: string]: any;
}

interface EntryData {
  id: string;
  startFrom: string;
  end: string;
  make: string;
  model: string;
  products: Product[];
}

export default function EditSearchEntryPage() {
  const { id } = useParams();
  const app = useAppBridge();
  const router = useRouter();
  const [entry, setEntry] = useState<EntryData | null>(null);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [allFetchedProducts, setAllFetchedProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { selectedResources, handleSelectionChange } = useIndexResourceState(allFetchedProducts);

  const yearOptions = Array.from({ length: 2025 - 1990 + 1 }, (_, i) => {
    const value = (1990 + i).toString();
    return { label: value, value };
  });

  useEffect(() => {
    if (!id) return;
    setLoadingEntry(true);
    fetch(`/api/product/${id}`)
      .then((res) => res.json())
      .then((data: EntryData) => {
        setEntry(data);
        setYearFrom(data.startFrom);
        setYearTo(data.end);
        setMake(data.make);
        setModel(data.model);
        setProducts(data.products || []);
      })
      .catch((err) => console.error('Error fetching entry:', err))
      .finally(() => setLoadingEntry(false));
  }, [id]);

  useEffect(() => {
    const shop = app?.config?.shop;
    if (!shop) return;

    async function fetchProducts() {
      try {
        setLoadingProducts(true);
        const res = await axios.post(`/api/getproduct?shop=${shop}`, {
          query: GET_PRODUCTS_QUERY,
        });

        const productEdges = res.data?.data?.products?.edges || [];
        const productNodes = productEdges.map((edge: any) => {
          const gid: string = edge.node.id;
          const legacyResourceId = gid.split('/').pop();
          return {
            id: gid,
            gid,
            title: edge.node.title,
            legacyResourceId,
          };
        });

        setAllFetchedProducts(productNodes);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchProducts();
  }, [app]);

  const filteredProducts = useMemo(() => {
    return allFetchedProducts.filter((product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allFetchedProducts, searchTerm]);

  const handleAddProducts = () => {
    const selectedData = allFetchedProducts.filter((product) => selectedResources.includes(product.id));
    setProducts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      return [...prev, ...selectedData.filter((p) => !existingIds.has(p.id))];
    });
    setModalOpen(false);
  };

  const tabs = [
    {
      id: 'products',
      content: (
        <InlineStack align="center">
          <Icon source={ProductAddIcon} tone="base" />
          <Text as="span">{products.length} product{products.length !== 1 ? 's' : ''}</Text>
        </InlineStack>
      ) as unknown as string,
      panelID: 'products-content',
    },
  ];

  const handleSave = async () => {
    const shop = app?.config?.shop;
    if (!shop || !id) return;

    try {
      setIsSaving(true);
      const payload = {
        startFrom: yearFrom,
        end: yearTo,
        make,
        model,
        products,
        shop,
      };
      const res = await axios.put(`/api/product/${id}`, payload);
      app.toast?.show('Entry updated successfully!');
      router.push('/database');
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Page
      title="Edit Search Entry"
      backAction={{ content: 'Back', url: '/database' }}
      primaryAction={{
        content: isSaving ? 'Saving...' : 'Save',
        onAction: handleSave,
        disabled: isSaving,
        loading: isSaving,
      }}
    >
      <Card>
        <BlockStack gap="300">
          <Text as="h4" variant="headingMd">Search form preview</Text>
          {loadingEntry ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <Spinner accessibilityLabel="Loading YMM" size="large" />
            </div>
          ) : (
            <InlineStack wrap gap="300">
              <Select label="Year From" options={yearOptions} value={yearFrom} onChange={setYearFrom} />
              <Select label="Year To" options={yearOptions} value={yearTo} onChange={setYearTo} />
              <TextField label="Make" value={make} onChange={setMake} autoComplete='off' />
              <TextField label="Model" value={model} onChange={setModel} autoComplete='off' />
            </InlineStack>
          )}
        </BlockStack>
      </Card>

      <Card padding="0">
        <Tabs tabs={tabs} selected={0} onSelect={() => { }} />
        <div style={{ padding: '16px' }}>
          {loadingProducts ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <Spinner accessibilityLabel="Loading products" size="large" />
            </div>
          ) : (
            <IndexTable
              resourceName={{ singular: 'product', plural: 'products' }}
              itemCount={products.length}
              headings={[{ title: 'ID' }, { title: 'Title' }, { title: 'Actions' }]}
              selectable={false}
            >
              {products.map((product, index) => (
                <IndexTable.Row
                  key={product.legacyResourceId}
                  id={product.legacyResourceId}
                  position={index}
                >
                  <IndexTable.Cell>
                    <Text as="span" variant="bodyMd">{product.legacyResourceId}</Text>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Text as="span" variant="bodyMd" fontWeight="medium">{product.title}</Text>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Button
                      icon={DeleteIcon}
                      variant="tertiary"
                      accessibilityLabel="Remove product"
                      onClick={() => {
                        setProducts(prev => prev.filter(p => p.legacyResourceId !== product.legacyResourceId));
                      }}
                    />
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          )}
          <div style={{ textAlign: 'right', marginTop: '1rem' }}>
            <Button onClick={() => setModalOpen(true)}>Add Products</Button>
          </div>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Products"
        primaryAction={{
          content: 'Add',
          onAction: handleAddProducts,
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
              selectedItemsCount={selectedResources.length}
              onSelectionChange={handleSelectionChange}
              headings={[{ title: 'Product Title' }]}
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
    </Page>
  );
}
