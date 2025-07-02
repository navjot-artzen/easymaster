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
  Button,
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
  singleSelect = false, // <-- new optional prop
}: ProductModalProps & { singleSelect?: boolean }) {
  const [localLoading, setLocalLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]); // used only in singleSelect

  useEffect(() => {
    if (open) {
      setLocalLoading(true);
      setSelected([]); // clear previous selection on modal open
      const timer = setTimeout(() => setLocalLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [open]);

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

  const handleRowClick = (id: string) => {
    if (singleSelect) {
      onAdd([filteredProducts.find((p) => p.id === id)!]);
      onClose();
    }
  };

  const renderRows = () =>
    filteredProducts.map(({ id, title }, index) => {
      const isSelected = singleSelect ? selected.includes(id) : selectedResources.includes(id);
      return (
        <IndexTable.Row
          id={id}
          key={id}
          position={index}
          selected={isSelected}
          onClick={() => (singleSelect ? handleRowClick(id) : undefined)}
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
                cursor: singleSelect ? 'pointer' : 'default',
              }}
            >
              {title}
            </span>
          </IndexTable.Cell>
        </IndexTable.Row>
      );
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Products"
      primaryAction={
        singleSelect
          ? undefined
          : {
              content: 'Add',
              onAction: () => {
                const selected = filteredProducts.filter((product) =>
                  selectedResources.includes(product.id)
                );
                onAdd(selected);
                onClose();
              },
              disabled: localLoading,
            }
      }
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
              selectable={!singleSelect}
            >
              {renderRows()}
            </IndexTable>
          )}
        </div>
      </Modal.Section>
    </Modal>
  );
}
