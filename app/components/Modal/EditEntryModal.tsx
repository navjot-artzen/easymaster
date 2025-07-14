'use client';

import React from 'react';
import { Modal, FormLayout, Select, TextField } from '@shopify/polaris';
import { EditEntryModalProps } from '@/types/interfaces';

export default function EditEntryModal({
  open,
  year,
  make,
  model,
  driveType,
  engineType,
  note,
  yearOptions,
  driveTypeOptions,
  validationErrors,
  setYear,
  setMake,
  setModel,
  setdriveType,
  setEngineType,
  setNote,
  onUpdate,
  onCancel,
}: EditEntryModalProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Edit Entry"
      primaryAction={{ content: 'Update', onAction: onUpdate }}
      secondaryActions={[{ content: 'Cancel', onAction: onCancel }]}
    >
      <Modal.Section>
        <FormLayout>
          <Select
            label="From Year"
            options={yearOptions}
            value={year.split('-')[0] || ''}
            onChange={(val) => setYear(`${val}-${year.split('-')[1] || val}`)}
            error={validationErrors.yearFrom}
          />
          <Select
            label="To Year"
            options={yearOptions}
            value={year.split('-')[1] || ''}
            onChange={(val) => setYear(`${year.split('-')[0] || val}-${val}`)}
            error={validationErrors.yearTo}
          />
          <TextField
            label="Make"
            value={make}
            onChange={(val) => setMake(val.charAt(0).toUpperCase() + val.slice(1))}
            error={validationErrors.make}
            autoComplete="off"
          />
          <TextField
            label="Model"
            value={model}
            onChange={(val) => setModel(val.charAt(0).toUpperCase() + val.slice(1))}
            error={validationErrors.model}
            autoComplete="off"
          />
          <Select
            label="Vehicle Type"
            options={driveTypeOptions}
            value={driveType}
            onChange={(selected) => setdriveType(selected as 'AWD' | 'FWD' | 'RWD' | '4WD')}
            error={validationErrors.driveType}
          />
          <TextField
            label="Engine Type"
            value={engineType}
            onChange={(val) => setEngineType(val)}
            error={validationErrors.engineType}
            autoComplete="off"

          />
           <TextField
            label="Note(Optional)"
            value={note}
            onChange={(val) => setNote(val)}
            autoComplete="off"

          />
          
        </FormLayout>
      </Modal.Section>
    </Modal>
  );
}
