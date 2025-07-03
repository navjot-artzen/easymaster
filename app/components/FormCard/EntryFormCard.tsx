'use client';

import { EntryProps } from '@/types/interfaces';
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
import React from 'react';

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
  return (
    <Card padding="400">
      <BlockStack gap="200">
        {/* Top row - year, make, model */}
        <InlineStack gap="300" wrap={false}>
          <div style={{ minWidth: '110px', flexGrow: 1 }}>
            <Select
              label="From Year"
              options={yearOptions}
              value={year.split('-')[0] || ''}
              onChange={(val) => onChangeYear('from', val)}
              error={validationErrors.yearFrom}
            />
          </div>
          <div style={{ minWidth: '110px', flexGrow: 1 }}>
            <Select
              label="To Year"
              options={yearOptions}
              value={year.split('-')[1] || ''}
              onChange={(val) => onChangeYear('to', val)}
              error={validationErrors.yearTo}
            />
          </div>
          <div style={{ minWidth: '110px' }}>
            <TextField
              label="Make"
              value={make}
              onChange={onChangeMake}
              autoComplete="off"
              placeholder="e.g. Honda"
              error={validationErrors.make}
            />
          </div>
          <div style={{ minWidth: '110px', }}>
            <TextField
              label="Model"
              value={model}
              onChange={onChangeModel}
              autoComplete="off"
              placeholder="e.g. Civic"
              error={validationErrors.model}
            />
          </div>
        </InlineStack>

        {/* Bottom row - engine type, drive type, add button */}
        <InlineStack gap="300" wrap={false}>
          <div style={{ minWidth: '120px', flexGrow: 1 }}>
            <TextField
              label="Engine Type"
              value={engineType}
              onChange={onChangeEngineType}
              autoComplete="off"
              placeholder="e.g. 4.3L V6"
              error={validationErrors.engineType}
            />
          </div>
          <div style={{ minWidth: '120px', flexGrow: 1 }}>
            <Select
              label="Drive Type"
              options={driveTypeOptions}
              value={driveType}
              onChange={(selected) =>
                onChangedriveType(selected as 'AWD' | 'FWD' | 'RWD')
              }
              error={validationErrors.driveType}
            />
          </div>
          <div style={{ minWidth: '120px', flexGrow: 1 }}>
            <TextField
              label="Note(Optional)"
              value={note}
              onChange={onChangeNote}
              autoComplete="off"
              placeholder=""
            />
          </div>
          <div
            style={{
              alignSelf: 'center',
              marginTop: Object.keys(validationErrors).length === 0 ? '20px' : '0px',
            }}
          >

          </div>
        </InlineStack>

        {/* Table of entries */}
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

        {/* Save button */}
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
