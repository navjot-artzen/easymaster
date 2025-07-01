'use client';

import React from 'react';
import { Card, BlockStack, Text, Button } from '@shopify/polaris';
import { SelectedProductsCardProps } from '@/types/interfaces';

export function SelectedProductsCard({
  selectedItems,
  showForm,
  onAddClick,
  onContinueClick,
}: SelectedProductsCardProps) {
  return (
    <Card padding="600">
      <BlockStack gap="400">
        <Text as="p" variant="headingSm">
          Selected Products
        </Text>
        {selectedItems.length === 0 ? (
          <Text as="p" tone="subdued">
            No products associated with the search rule
          </Text>
        ) : (
          selectedItems.map((item) => (
            <Text as="p" key={item.id}>
              {item.title}
            </Text>
          ))
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button onClick={onAddClick} disabled={showForm}>
            {selectedItems.length > 0 ? 'Add More Products' : 'Add Products'}
          </Button>
          {!showForm && selectedItems.length > 0 && (
            <Button
              onClick={onContinueClick}
              variant="primary"
              size="slim"
            >
              Continue
            </Button>
          )}
        </div>
      </BlockStack>
    </Card>
  );
}
