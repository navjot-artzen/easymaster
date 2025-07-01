'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  TextField,
  Icon,
  IndexTable,
  useIndexResourceState,
  Spinner,
  BlockStack,
} from '@shopify/polaris';
import { SearchListIcon } from '@shopify/polaris-icons';
import { Product, ProductModalProps } from '@/types/interfaces';

export default function ProductModal({
  open,
  onClose,
  products,
  searchTerm,
  setSearchTerm,
  onAdd,
}: ProductModalProps) {
  const [localLoading, setLocalLoading] = useState(true);

  // Simulate internal loading (you can customize this based on your real async logic)
  useEffect(() => {
    if (open) {
      setLocalLoading(true);
      const timer = setTimeout(() => {
        setLocalLoading(false);
      }, 500); // simulate loading delay
      return () => clearTimeout(timer);
    }
  }, [open, products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
  } = useIndexResourceState<Product>(filteredProducts);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Products"
      primaryAction={{
        content: 'Add',
        onAction: () => {
          const selected = filteredProducts.filter((product) =>
            selectedResources.includes(product.id)
          );
          onAdd(selected);
          onClose();
        },
        disabled: localLoading,
      }}
      secondaryActions={[{ content: 'Cancel', onAction: onClose }]}
    >
      <Modal.Section>
        <TextField
          label="Search Products"
          value={searchTerm}
          onChange={setSearchTerm}
          autoComplete="off"
          prefix={<Icon source={SearchListIcon} tone="base" />}
          disabled={localLoading}
        />
        <div style={{ marginTop: '16px' }}>
          {localLoading ? (
            <BlockStack align="center">
              <Spinner accessibilityLabel="Loading products" size="large" />
            </BlockStack>
          ) : (
            <IndexTable
              resourceName={{ singular: 'product', plural: 'products' }}
              itemCount={filteredProducts.length}
              selectedItemsCount={
                allResourcesSelected ? 'All' : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              headings={[{ title: 'Product' }]}
              selectable
            >
              {filteredProducts.map(({ id, title }, index) => (
                <IndexTable.Row
                  id={id}
                  key={id}
                  selected={selectedResources.includes(id)}
                  position={index}
                >
                  <IndexTable.Cell>
                    <span
                      style={{
                        display: 'inline-block',
                        maxWidth: '200px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        verticalAlign: 'middle',
                      }}
                    >
                      {title}
                    </span>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          )}
        </div>
      </Modal.Section>
    </Modal>
  );
}
