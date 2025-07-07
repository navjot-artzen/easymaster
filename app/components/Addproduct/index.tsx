'use client';

import { useAppBridge } from '@shopify/app-bridge-react';
import {
  Page,
  BlockStack,
  Banner,
  Button,
} from '@shopify/polaris';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import EditEntryModal from '../Modal/EditEntryModal';
import { Entry, Product, ValidationErrors } from '@/types/interfaces';
import { EntryFormCard } from '../FormCard/EntryFormCard';
import { SelectedProductsCard } from '../FormCard/SelectProductCard';

export default function ProductTargetSelector() {
  const [selectedItems, setSelectedItems] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [year, setYear] = useState('2000-2000');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [note, setNote] = useState('');
  const [driveType, setdriveType] = useState<'AWD' | 'FWD' | 'RWD'>('AWD');
  const [isSaving, setIsSaving] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [engineType, setEngineType] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const router = useRouter();
  const app = useAppBridge();


  const yearOptions = Array.from({ length: 2025 - 2000 + 1 }, (_, i) => {
    const value = (2000 + i).toString();
    return { label: value, value };
  });

  const driveTypeOptions = [
    { label: 'AWD', value: 'AWD' },
    { label: 'FWD', value: 'FWD' },
    { label: 'RWD', value: 'RWD' },
  ];

  const validateFields = (): boolean => {
    const errors: ValidationErrors = {};
    const [from, to] = year.split('-');

    if (!from) errors.yearFrom = 'Select from year';
    if (!to) errors.yearTo = 'Select to year';

    const fromYear = parseInt(from, 10);
    const toYear = parseInt(to, 10);

    if (from && to && fromYear > toYear) {
      errors.yearFrom = 'From year must be less than or equal to To year';
      errors.yearTo = 'To year must be greater than or equal to From year';
    }

    if (!make.trim()) errors.make = 'Enter make';
    if (!model.trim()) errors.model = 'Enter model';
    if (!driveType) errors.driveType = 'Select vehicle type';
    if (!engineType.trim()) errors.engineType = 'Enter engine type';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddEntry = () => {
    if (!validateFields()) return;
    const [from, to] = year.split('-');
    setEntries((prev) => [...prev, { from, to, make, model, driveType, engineType, note }]);
    setYear('');
    setMake('');
    setModel('');
    setdriveType('AWD');
    setEngineType('');
    setNote('');
    setValidationErrors({});
  };

  const handleEditSave = () => {
    if (!validateFields()) return;
    const [from, to] = year.split('-');
    const updated: Entry = { from, to, make, model, driveType, engineType, note };
    setEntries((prev) => prev.map((e, i) => (i === editIndex ? updated : e)));
    setEditModalOpen(false);
    setEditIndex(null);
    setYear('');
    setMake('');
    setModel('');
    setdriveType('AWD');
    setEngineType('');
    setNote('');
    setValidationErrors({});
  };

  const openEditModal = (index: number) => {
    const item = entries[index];
    setYear(`${item.from}-${item.to}`);
    setMake(item.make);
    setModel(item.model);
    setdriveType(item.driveType as 'AWD' | 'FWD' | 'RWD');
    setEngineType(item.engineType);
    setNote(item.note);
    setEditIndex(index);
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    const shop = (app as any)?.config?.shop;
    if (!shop) {
      return alert('Shop information is missing.');
    }

    let updatedEntries = [...entries];

    const isFormFilled =
      year && year.includes('-') && make.trim() && model.trim() && driveType;

    if (isFormFilled && validateFields()) {
      const [from, to] = year.split('-');
      const currentEntry = { from, to, make, model, driveType, engineType, note };
      updatedEntries.push(currentEntry);
    }

    if (selectedItems.length === 0 || updatedEntries.length === 0) {
      return alert('Please add at least one product and one YMM entry.');
    }

    const payload = updatedEntries.map((entry) => ({
      shop,
      year: `${entry.from}-${entry.to}`,
      make: entry.make,
      model: entry.model,
      driveType: entry.driveType,
      engineType: entry.engineType,
      note: entry.note,
      products: selectedItems.map((item) => ({
        productId: item.id,
        title: item.title,
      })),
    }));

    setIsSaving(true);

    try {
      const res = await axios.post('/api/product/add', payload);
      if (res?.data?.duplicateEntries?.length) {
        const msg = res.data.duplicateEntries[0];
        setApiError(`${msg.message} for ${msg.make} ${msg.model} ${msg.year}`);
        return;
      }
      router.push('/database');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save entries. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Use resource picker
  const selectProducts = async () => {
    
    
    try {
       const initialSelection = selectedItems.map((product) => ({
        id: product.id,
        type: 'product',
      }));
      const { selection }:any = await window.shopify.resourcePicker({
        type: 'product',
        multiple: true,
        action: 'select',
        selectionIds: initialSelection,

      });

      const selected = selection.map((product: any) => ({
        id: product.id,
        title: product.title,
        legacyResourceId: product.legacyResourceId,
      }));
      setSelectedItems(selected);

      // setSelectedItems((prev) => [
      //   ...prev.filter((item) => item.type !== 'products'),
      //   ...selected,
      // ]);
    } catch (error) {
      console.error('Error selecting products:', error);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  return (
    <Page
      fullWidth
      title="Product Target Selector"
      backAction={{ content: 'Back', onAction: () => router.push('/database') }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <BlockStack gap="400">
          <SelectedProductsCard
            selectedItems={selectedItems}
            showForm={showForm}
            onAddClick={selectProducts} // ✅ use resource picker
            onContinueClick={() => setShowForm(true)}
          />
          {apiError && (
            <Banner title="Duplicate Entry" tone="critical" onDismiss={() => setApiError(null)}>
              <p>{apiError}</p>
            </Banner>
          )}
          {showForm && (
            <EntryFormCard
              year={year}
              make={make}
              model={model}
              driveType={driveType}
              engineType={engineType}
              note={note}
              entries={entries}
              yearOptions={yearOptions}
              driveTypeOptions={driveTypeOptions}
              validationErrors={validationErrors}
              isSaving={isSaving}
              onChangeYear={(type, val) => {
                const parts = year.split('-');
                const from = type === 'from' ? val : parts[0];
                const to = type === 'to' ? val : parts[1];
                const fromYear = parseInt(from, 10);
                const toYear = parseInt(to, 10);

                setYear(`${from}-${to}`);

                setValidationErrors((prev) => {
                  const errors = { ...prev };
                  if (!from) errors.yearFrom = 'Select from year';
                  if (!to) errors.yearTo = 'Select to year';
                  if (from && to && fromYear > toYear) {
                    errors.yearFrom = 'From year must be <= To year';
                    errors.yearTo = 'To year must be >= From year';
                  } else {
                    delete errors.yearFrom;
                    delete errors.yearTo;
                  }
                  return errors;
                });
              }}
              onChangeMake={(val) => {
                const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
                setMake(capitalized);
                if (capitalized.trim()) {
                  setValidationErrors((prev) => ({ ...prev, make: undefined }));
                }
              }}
              onChangeModel={(val) => {
                const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
                setModel(capitalized);
                if (capitalized.trim()) {
                  setValidationErrors((prev) => ({ ...prev, model: undefined }));
                }
              }}
              onChangedriveType={setdriveType}
              onChangeEngineType={(val) => {
                setEngineType(val);
                if (val) {
                  setValidationErrors((prev) => ({ ...prev, engineType: undefined }));
                }
              }}
              onChangeNote={(val) => setNote(val)}
              onAddEntry={handleAddEntry}
              onEdit={openEditModal}
              onDelete={(index) => setEntries((prev) => prev.filter((_, i) => i !== index))}
              onSave={handleSave}
            />
          )}

          <EditEntryModal
            open={editModalOpen}
            year={year}
            make={make}
            model={model}
            driveType={driveType}
            engineType={engineType}
            note={note}
            yearOptions={yearOptions}
            driveTypeOptions={driveTypeOptions}
            validationErrors={validationErrors}
            setYear={setYear}
            setMake={(val) => setMake(val.charAt(0).toUpperCase() + val.slice(1))}
            setModel={(val) => setModel(val.charAt(0).toUpperCase() + val.slice(1))}
            setdriveType={setdriveType}
            setEngineType={setEngineType}
            setNote={setNote}
            onUpdate={handleEditSave}
            onCancel={() => {
              setEditModalOpen(false);
              setEditIndex(null);
            }}
          />
        </BlockStack>
      </div>
    </Page>
  );
}
