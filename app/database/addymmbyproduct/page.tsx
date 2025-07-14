'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Page,
  BlockStack,
  Spinner,
  Text,
  Card,
} from '@shopify/polaris';
import { EntryFormCard } from '@/app/components/FormCard/EntryFormCard';
import EditEntryModal from '@/app/components/Modal/EditEntryModal';
import { useAppBridge } from '@shopify/app-bridge-react';

interface Entry {
  from: string;
  to: string;
  make: string;
  model: string;
  driveType: string;
  engineType: string;
  note: string;
}

function AddYmmEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacyId = searchParams.get('legacyId');

  const app = useAppBridge();
  const [productTitle, setProductTitle] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const [yearFrom, setYearFrom] = useState<string>('');
  const [yearTo, setYearTo] = useState<string>('');
  const [make, setMake] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [driveType, setDriveType] = useState<'AWD' | 'FWD' | 'RWD' | '4WD'>('AWD');
  const [engineType, setEngineType] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editYear, setEditYear] = useState<string>('');
  const [editMake, setEditMake] = useState<string>('');
  const [editModel, setEditModel] = useState<string>('');
  const [editDriveType, setEditDriveType] = useState<string>('AWD');
  const [editEngineType, setEditEngineType] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');

  const YEAR_OPTIONS = Array.from({ length: 31 }, (_, i) => {
    const year = 1995 + i;
    return { label: `${year}`, value: `${year}` };
  });

  const DRIVE_TYPE_OPTIONS = [
    { label: 'FWD', value: 'FWD' },
    { label: 'RWD', value: 'RWD' },
    { label: 'AWD', value: 'AWD' },
    { label: '4WD', value: '4WD' },
  ];

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/product/getproduct?legacyId=${legacyId}`);
        const data = await res.json();
        if (res.ok) setProductTitle(data.productTitle || '');
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (legacyId) fetchProduct();
  }, [legacyId]);

  const handleChangeYear = (type: 'from' | 'to', value: string) => {
    if (type === 'from') setYearFrom(value);
    else setYearTo(value);
  };

  const handleAddEntry = () => {
    const newErrors: Record<string, string> = {};
    if (!yearFrom) newErrors.yearFrom = 'Required';
    if (!yearTo) newErrors.yearTo = 'Required';
    if (!make) newErrors.make = 'Required';
    if (!model) newErrors.model = 'Required';
    if (!engineType) newErrors.engineType = 'Required';

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    setEntries([
      ...entries,
      { from: yearFrom, to: yearTo, make, model, driveType, engineType, note },
    ]);

    setYearFrom('');
    setYearTo('');
    setMake('');
    setModel('');
    setDriveType('AWD');
    setEngineType('');
    setNote('');
    setValidationErrors({});
  };

  const handleEdit = (index: number) => {
    const entry = entries[index];
    setEditIndex(index);
    setEditYear(`${entry.from}-${entry.to}`);
    setEditMake(entry.make);
    setEditModel(entry.model);
    setEditDriveType(entry.driveType);
    setEditEngineType(entry.engineType);
    setEditNote(entry.note || '');
    setEditModalOpen(true);
  };

  const handleDelete = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleUpdate = () => {
    const newErrors: Record<string, string> = {};
    const [from, to] = editYear.split('-');
    if (!from) newErrors.yearFrom = 'Required';
    if (!to) newErrors.yearTo = 'Required';
    if (!editMake) newErrors.make = 'Required';
    if (!editModel) newErrors.model = 'Required';
    if (!editEngineType) newErrors.engineType = 'Required';
    if (!editDriveType) newErrors.driveType = 'Required';

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    const updatedEntry = {
      from,
      to,
      make: editMake,
      model: editModel,
      driveType: editDriveType,
      engineType: editEngineType,
      note: editNote ?? '',
    };

    setEntries((prev) => prev.map((entry, idx) => (idx === editIndex ? updatedEntry : entry)));
    setEditModalOpen(false);
    setValidationErrors({});
  };

  const handleSave = async () => {
    const shop = (app as any)?.config?.shop;
    const toast=app?.toast
    if (!shop) return toast.show('Shop information is missing.',{isError:true});

    setIsSaving(true);
    try {
      const res = await fetch(`/api/product/getproduct?legacyId=${legacyId}`);
      const data = await res.json();
      if (!res.ok || !data?.gid || !data?.productTitle) {
        throw new Error(data?.error || 'Product not found');
      }

      const productInput = {
        productId: data.gid,
        title: data.productTitle,
        legacyResourceId: data.legacyId,
      };

      let updatedEntries = [...entries];
      const isFormFilled = yearFrom && yearTo && make.trim() && model.trim() && driveType && engineType;

      if (isFormFilled) {
        updatedEntries.push({ from: yearFrom, to: yearTo, make, model, driveType, engineType, note });
      }

      if (updatedEntries.length === 0) {
        toast.show('Please add at least one valid YMM entry.',{isError:true});
        return;
      }

      const payload = updatedEntries.map((entry) => ({
        shop,
        year: `${entry.from}-${entry.to}`,
        make: entry.make,
        model: entry.model,
        driveType: entry.driveType,
        engineType: entry.engineType,
        note: entry.note,
        products: [productInput],
      }));

      const saveRes = await fetch('/api/product/add', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await saveRes.json();

      if (!saveRes.ok) throw new Error(result?.error || 'Failed to save entries');

      if (result?.duplicateEntries?.length > 0) {
        const dup = result.duplicateEntries[0];
        toast.show(`${dup.message} for ${dup.make} ${dup.model} ${dup.year}`,{isError:true});
        return;
      }

      toast.show('Saved successfully');
      router.push('/database');
      setEntries([]);
      setYearFrom('');
      setYearTo('');
      setMake('');
      setModel('');
      setDriveType('AWD');
      setEngineType('');
      setNote('');
    } catch (err: any) {
      console.error('Save error:', err);
      toast.show(err.message || 'An error occurred while saving.',{isError:true});
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Page fullWidth>
        <BlockStack align="center" inlineAlign="center" gap="400">
          <Spinner accessibilityLabel="Loading" size="large" />
        </BlockStack>
      </Page>
    );
  }

  return (
    <Page
    backAction={{ content: "Back", onAction:()=>router.back() }}
     fullWidth title="Add YMM Entry">
      <div style={{margin: '0 auto' }}> 
      <BlockStack gap="400">
        <Card padding="600">
          <Text as="p" variant="headingSm">Associated Product</Text>
          <Text as="p">{productTitle}</Text>
        </Card>
        <EntryFormCard
          year={`${yearFrom}-${yearTo}`}
          make={make}
          model={model}
          driveType={driveType}
          engineType={engineType}
          note={note}
          entries={entries}
          yearOptions={YEAR_OPTIONS}
          driveTypeOptions={DRIVE_TYPE_OPTIONS}
          validationErrors={validationErrors}
          isSaving={isSaving}
          onChangeYear={handleChangeYear}
          onChangeMake={setMake}
          onChangeModel={setModel}
          onChangedriveType={setDriveType}
          onChangeEngineType={setEngineType}
          onChangeNote={setNote}
          onAddEntry={handleAddEntry}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSave={handleSave}
        />

        <EditEntryModal
          open={editModalOpen}
          year={editYear}
          make={editMake}
          model={editModel}
          driveType={editDriveType}
          engineType={editEngineType}
          note={editNote}
          yearOptions={YEAR_OPTIONS}
          driveTypeOptions={DRIVE_TYPE_OPTIONS}
          validationErrors={validationErrors}
          setYear={setEditYear}
          setMake={setEditMake}
          setModel={setEditModel}
          setdriveType={setEditDriveType}
          setEngineType={setEditEngineType}
          setNote={setEditNote}
          onUpdate={handleUpdate}
          onCancel={() => {
            setEditModalOpen(false);
            setValidationErrors({});
          }}
        />
      </BlockStack>
      </div>
    </Page>
  );
}

// ✅ Single default export: wrapped with Suspense
export default function PageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddYmmEntryPage />
    </Suspense>
  );
}
