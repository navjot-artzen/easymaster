'use client';

import {
  Card,
  BlockStack,
  InlineStack,
  Select,
  TextField,
  Button,
  IndexTable,
} from '@shopify/polaris';
import { DeleteIcon, EditIcon } from '@shopify/polaris-icons';
import React, { useEffect, useState } from 'react';
import { EntryProps } from '@/types/interfaces';

export function EntryFormCard({
  year,
  make,
  model,
  driveType,
  engineType,
  note,
  entries,
  yearOptions,
  driveTypeOptions,
  validationErrors,
  isSaving,
  onChangeYear,
  onChangeMake,
  onChangeModel,
  onChangedriveType,
  onChangeEngineType,
  onChangeNote,
  onAddEntry,
  onEdit,
  onDelete,
  onSave,
}: EntryProps) {
  const [makesData, setMakesData] = useState<{ name: string; models: any[] }[]>([]);
  const [makeOptions, setMakeOptions] = useState<{ label: string; value: string }[]>([]);
  const [modelOptions, setModelOptions] = useState<{ label: string; value: string }[]>([]);

  const [showMakeSuggestions, setShowMakeSuggestions] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);

  useEffect(() => {
    const fetchMakeModel = async () => {
      try {
        const res = await fetch('/api/make-model');
        const data = await res.json();
        if (data?.makes) {
          setMakesData(data.makes);
          const makeList = data.makes.map((m: any) => ({
            label: m.name,
            value: m.name,
          }));
          setMakeOptions(makeList);
        }
      } catch (err) {
        console.error('Error fetching makes/models', err);
      }
    };
    fetchMakeModel();
  }, []);

  const handleMakeChange = (makeName: string) => {
    const selected = makesData.find((m) => m.name.toLowerCase() === makeName.toLowerCase());
    const models = selected?.models || [];
    setModelOptions(
      models.map((model: any) => ({
        label: typeof model === 'string' ? model : model.name,
        value: typeof model === 'string' ? model : model.name,
      }))
    );
  };

  const filterOptions = (
    options: { label: string; value: string }[],
    input: string
  ) => {
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(input.toLowerCase())
    );
  };

  return (
    <Card padding="400">
      <BlockStack gap="200">
        {/* Top row */}
        <InlineStack gap="300" wrap={false}>
          <div style={{ maxWidth: '25%', flexGrow: 1 }}>
            <Select
              label="From Year"
              options={yearOptions}
              value={year.split('-')[0] || ''}
              onChange={(val) => onChangeYear('from', val)}
              error={validationErrors.yearFrom}
            />
          </div>
          <div style={{ maxWidth: '25%', flexGrow: 1 }}>
            <Select
              label="To Year"
              options={yearOptions}
              value={year.split('-')[1] || ''}
              onChange={(val) => onChangeYear('to', val)}
              error={validationErrors.yearTo}
            />
          </div>

          {/* Make hybrid input */}
          <div style={{ position: 'relative', maxWidth: '25%', flexGrow: 1 }}>
            <TextField
              label="Make"
              value={make}
              onChange={(val) => {
                onChangeMake(val);
                onChangeModel('');
                setShowMakeSuggestions(true);
                handleMakeChange(val);
              }}
              autoComplete="off"
              placeholder="Type or select make"
              error={validationErrors.make}
              onFocus={() => setShowMakeSuggestions(true)}
              onBlur={() => setTimeout(() => setShowMakeSuggestions(false), 150)}
            />
            {showMakeSuggestions && filterOptions(makeOptions, make).length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderTop: 'none',
                  maxHeight: '150px',
                  overflowY: 'auto',
                }}
              >
                {filterOptions(makeOptions, make).map((option) => (
                  <div
                    key={option.value}
                    onMouseDown={() => {
                      onChangeMake(option.value);
                      handleMakeChange(option.value);
                      setShowMakeSuggestions(false);
                    }}
                    style={{ padding: '8px', cursor: 'pointer' }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Model hybrid input */}
          <div style={{ position: 'relative', maxWidth: '25%', flexGrow: 1 }}>
            <TextField
              label="Model"
              value={model}
              onChange={(val) => {
                onChangeModel(val);
                setShowModelSuggestions(true);
              }}
              autoComplete="off"
              placeholder="Type or select model"
              error={validationErrors.model}
              onFocus={() => setShowModelSuggestions(true)}
              onBlur={() => setTimeout(() => setShowModelSuggestions(false), 150)}
            />
            {showModelSuggestions && filterOptions(modelOptions, model).length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderTop: 'none',
                  maxHeight: '150px',
                  overflowY: 'auto',
                }}
              >
                {filterOptions(modelOptions, model).map((option) => (
                  <div
                    key={option.value}
                    onMouseDown={() => {
                      onChangeModel(option.value);
                      setShowModelSuggestions(false);
                    }}
                    style={{ padding: '8px', cursor: 'pointer' }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </InlineStack>

        {/* Bottom row */}
        <InlineStack gap="300" wrap={false}>
          <div style={{ position: 'relative', maxWidth: '23.5%', flexGrow: 1 }}>
            <TextField
              label="Engine Type"
              value={engineType}
              onChange={onChangeEngineType}
              autoComplete="off"
              placeholder="e.g. 4.3L V6"
              error={validationErrors.engineType}
            />
          </div>
          <div style={{ maxWidth: '23.5%', flexGrow: 1 }}>
            <Select
              label="Drive Type"
              options={driveTypeOptions}
              value={driveType}
              onChange={(selected) =>
                onChangedriveType(selected as 'AWD' | 'FWD' | 'RWD' | '4WD')
              }
              error={validationErrors.driveType}
            />
          </div>
          <div style={{ maxWidth: '25%', flexGrow: 1 }}>
            <TextField
              label="Note (Optional)"
              value={note}
              onChange={onChangeNote}
              autoComplete="off"
            />
          </div>
        </InlineStack>

        {/* Entry Table */}
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
                { title: 'Engine Type' },
                { title: 'Note' },
                { title: 'Actions' },
              ]}
            >
              {entries.map((item, index) => (
                <IndexTable.Row id={`${index}`} key={index} position={index}>
                  <IndexTable.Cell>{item.from}</IndexTable.Cell>
                  <IndexTable.Cell>{item.to}</IndexTable.Cell>
                  <IndexTable.Cell>{item.make}</IndexTable.Cell>
                  <IndexTable.Cell>{item.model}</IndexTable.Cell>
                  <IndexTable.Cell>{item.driveType}</IndexTable.Cell>
                  <IndexTable.Cell>{item.engineType}</IndexTable.Cell>
                  <IndexTable.Cell>{item.note}</IndexTable.Cell>
                  <IndexTable.Cell>
                    <InlineStack>
                      <Button
                        icon={EditIcon}
                        variant="tertiary"
                        onClick={() => onEdit(index)}
                      />
                      <Button
                        icon={DeleteIcon}
                        variant="tertiary"
                        onClick={() => onDelete(index)}
                      />
                    </InlineStack>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          </Card>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Button onClick={onAddEntry} size="slim" variant="secondary">
            Add More
          </Button>
          <Button
            variant="primary"
            onClick={onSave}
            disabled={isSaving}
            loading={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </BlockStack>
    </Card>
  );
}
