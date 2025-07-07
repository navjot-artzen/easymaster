'use client';

import {
  Modal,
  TextField,
  InlineStack,
  Select,
} from '@shopify/polaris';
import { useEffect, useState } from 'react';

interface EditEntryModalProps {
  open: boolean;
  initialData: {
    make: string;
    model: string;
    years: string;
    engineOptions?: string;
    drive?: string;
    note?:string;
  };
  onClose: () => void;
  onSave: (updated: {
    make: string;
    model: string;
    years: string;
    engineOptions?: string;
    drive?: string;
    note?:string;
  }) => void;
}


export function EditModal({
  open,
  initialData,
  onClose,
  onSave,
}: EditEntryModalProps) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [engineOptions, setEngineOptions] = useState('');
  const [driveType, setDriveType] = useState('');
  const [note,setNote]=useState('')
  useEffect(() => {
    if (open && initialData) {
      setMake(initialData.make || '');
      setModel(initialData.model || '');
      const normalizedYears = initialData.years.replace(/[–—−]/g, '-');
      const [fromYear, toYear] = normalizedYears.split('-');
      setFrom(fromYear?.trim() || '');
      setTo(toYear?.trim() || '');
      setEngineOptions(initialData.engineOptions || '');
      setDriveType(initialData.drive|| '');
      setNote(initialData.note|| '')
    }
  }, [open, initialData]);

  const handleSave = () => {
    const years = `${from}-${to}`;
    onSave({ make, model, years, engineOptions, drive: driveType,note });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Vehicle Entry"
      primaryAction={{ content: 'Save', onAction: handleSave }}
      secondaryActions={[{ content: 'Cancel', onAction: onClose }]}
    >
      <Modal.Section>
        <InlineStack gap="400" wrap={false}>
          <TextField label="Make" value={make} onChange={setMake} autoComplete="off" />
          <TextField label="Model" value={model} onChange={setModel} autoComplete="off" />
        </InlineStack>

        <div style={{ height: 16 }} />

        <InlineStack gap="400" wrap={false}>
          <TextField label="From Year" value={from} onChange={setFrom} autoComplete="off" />
          <TextField label="To Year" value={to} onChange={setTo} autoComplete="off" />
        </InlineStack>

        <div style={{ height: 16 }} />

        <TextField
          label="Engine Type"
          value={engineOptions}
          onChange={setEngineOptions}
          placeholder="e.g. 5.3L V8"
          autoComplete="off"
        />

        <div style={{ height: 16 }} />

        <Select
          label="Drive Type"
          value={driveType}
          options={[ 'RWD', 'FWD', 'AWD']}
          onChange={setDriveType}
        />
         <TextField
          label="Note"
          value={note}
          onChange={setNote}
          placeholder=""
          autoComplete="off"
        />
      </Modal.Section>
    </Modal>
  );
}
