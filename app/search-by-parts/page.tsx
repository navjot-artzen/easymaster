'use client';

import { useState } from 'react';
import {
  Page,
  Card,
  TextField,
  IndexTable,
  Spinner,
  Text,
  Button,
  InlineStack,
} from '@shopify/polaris';

interface VehicleEntry {
  make: string;
  model: string;
  years: string;
}

export default function SearchTablePage() {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [inputError, setInputError] = useState<string | undefined>(undefined);
  const [tableData, setTableData] = useState<VehicleEntry[]>([]);

  const handleSubmit = async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) {
      setInputError('Please enter a part number'); // ✅ Polaris-style validation message
      setClicked(false);
      return;
    }

    setInputError(undefined); // ✅ clear error when input is valid
    setClicked(true);
    setLoading(true);

    try {
      const response = await fetch('/api/search-parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partNumber: trimmedValue }),
      });

      const result = await response.json();
      setTableData(result.compatibleVehicles || []);
    } catch (err) {
      console.error('Search error:', err);
      setTableData([]);
    }

    setLoading(false);
  };

  const handleClear = () => {
    setInputValue('');
    setTableData([]);
    setClicked(false);
    setInputError(undefined);
  };

  return (
    <Page title="Search Compatible Vehicle by Part Number">
      {/* Search Field */}
      <div style={{ display: 'flex', justifyContent: 'start' }}>
        <div style={{ maxWidth: 1000, width: '100%' }}>
          <Card>
            <InlineStack gap="400" align="start" wrap={false}>
              <div style={{ flexGrow: 1 }}>
                <TextField
                  labelHidden
                  label="Search Parts"
                  value={inputValue}
                  onChange={(value) => {
                    setInputValue(value);
                    if (inputError && value.trim()) {
                      setInputError(undefined); // ✅ clear error on typing
                    }
                  }}
                  autoComplete="off"
                  placeholder="Enter part number"
                  error={inputError}
                />
              </div>

              <div style={{ alignSelf: 'flex-start' }}>
                <Button onClick={handleSubmit}>Search</Button>
              </div>

              <div style={{ alignSelf: 'flex-start' }}>
                <Button tone="critical" onClick={handleClear}>Clear</Button>
              </div>
            </InlineStack>
          </Card>

        </div>
      </div>

      <div style={{ height: '24px' }} />

      {/* Loading Spinner */}
      {loading && (
        <Card>
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <Spinner accessibilityLabel="Loading" size="large" />
          </div>
        </Card>
      )}

      {/* Table */}
      {!loading && tableData.length > 0 && (
        <Card>
          <IndexTable
            resourceName={{ singular: 'part', plural: 'parts' }}
            itemCount={tableData.length}
            headings={[
              { title: 'Make' },
              { title: 'Model' },
              { title: 'Year' },
            ]}
            selectable={false}
          >
            {tableData.map((part, index) => (
              <IndexTable.Row id={index.toString()} key={index} position={index}>
                <IndexTable.Cell>{part.make}</IndexTable.Cell>
                <IndexTable.Cell>{part.model}</IndexTable.Cell>
                <IndexTable.Cell>{part.years}</IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        </Card>
      )}

      {/* No Results */}
      {!loading && clicked && tableData.length === 0 && (
        <Card>
          <div style={{ padding: '16px' }}>
            <Text as="p" tone="subdued">No results found.</Text>
          </div>
        </Card>
      )}
    </Page>
  );
}
