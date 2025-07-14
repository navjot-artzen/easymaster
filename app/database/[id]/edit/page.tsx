"use client";

import {
  Page,
  Card,
  TextField,
  Select,
  BlockStack,
  InlineStack,
  Icon,
  Tabs,
  IndexTable,
  Text,
  Spinner,
} from "@shopify/polaris";
import { ProductAddIcon } from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { EntryData, Product } from "@/types/interfaces";

export default function EditSearchEntryPage() {
  const { id } = useParams();
  const app = useAppBridge();
  const router = useRouter();

  const [entry, setEntry] = useState<EntryData | null>(null);
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [note, setNote] = useState("");
  const [driveType, setdriveType] = useState("");
  const [engineType, setEngineType] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const yearOptions = Array.from({ length: 2025 - 2000 + 1 }, (_, i) => {
    const value = (2000 + i).toString();
    return { label: value, value };
  });

  const driveTypeOptions = [
    { label: 'Select Drive Type', value: '' },
    { label: "AWD", value: "AWD" },
    { label: "FWD", value: "FWD" },
    { label: "RWD", value: "RWD" },
    { label: "4WD", value: "4WD" },
  ];

  useEffect(() => {
    if (!id) return;
    setLoadingEntry(true);
    fetch(`/api/product/${id}`)
      .then((res) => res.json())
      .then((data: EntryData) => {
        setEntry(data);
        setYearFrom(data.startFrom);
        setYearTo(data.end);
        setMake(data.make);
        setModel(data.model);
        setdriveType(data.driveType || "");
        setEngineType(data.engineType);
        setNote(data.note);
        setProducts(data.products || []);
      })
      .catch((err) => console.error("Error fetching entry:", err))
      .finally(() => setLoadingEntry(false));
  }, [id]);

  const tabs = [
    {
      id: "products",
      content: (
        <InlineStack align="center">
          <Icon source={ProductAddIcon} tone="base" />
          <Text as="span">
            {products.length} product{products.length !== 1 ? "s" : ""}
          </Text>
        </InlineStack>
      ) as unknown as string,
      panelID: "products-content",
    },
  ];

const handleSave = async () => {
  const shop = app?.config?.shop;
  if (!shop || !id) return;

  // 🚨 Validate required fields
  const missingFields: string[] = [];

  if (!yearFrom) missingFields.push('Year From');
  if (!yearTo) missingFields.push('Year To');
  if (!make.trim()) missingFields.push('Make');
  if (!model.trim()) missingFields.push('Model');
  if (!engineType || engineType.trim() === '') missingFields.push('Engine Type');
  if (!driveType || driveType.trim() === '') missingFields.push('Drive Type');

  if (products.length === 0) missingFields.push('At least one product');

  if (missingFields.length > 0) {
    const message = `Please fill out the following fields:\n- ${missingFields.join('\n, ')}`;
    app.toast?.show(message,{isError:true});
    return;
  }

  try {
    setIsSaving(true);
    const payload = {
      startFrom: yearFrom,
      end: yearTo,
      make,
      model,
      driveType,
      engineType,
      note,
      products,
      shop,
    };
    await axios.put(`/api/product/${id}`, payload);
    app.toast?.show('Entry updated successfully!');
    router.push('/database');
  } catch (error) {
    console.error('Update failed:', error);
    alert('Failed to update. Check console for details.');
  } finally {
    setIsSaving(false);
  }
};

  return (
    <Page
      fullWidth
      title="Edit Search Entry"
      backAction={{ content: "Back", onAction:()=>router.back() }}
      primaryAction={{
        content: isSaving ? "Saving..." : "Save",
        onAction: handleSave,
        disabled: isSaving,
        loading: isSaving,
      }}
    >
      <Card>
        <BlockStack gap="300">
          <Text as="h4" variant="headingMd">
            Search form preview
          </Text>
          {loadingEntry ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <Spinner accessibilityLabel="Loading YMM" size="large" />
            </div>
          ) : (
            <InlineStack wrap gap="300">
              <Select
                label="Year From"
                options={yearOptions}
                value={yearFrom}
                onChange={setYearFrom}
              />
              <Select
                label="Year To"
                options={yearOptions}
                value={yearTo}
                onChange={setYearTo}
              />
              <TextField
                label="Make"
                value={make}
                onChange={(val) =>
                  setMake(val.charAt(0).toUpperCase() + val.slice(1))
                }
                autoComplete="off"
              />
              <TextField
                label="Model"
                value={model}
                onChange={(val) =>
                  setModel(val.charAt(0).toUpperCase() + val.slice(1))
                }
                autoComplete="off"
              />
              <Select
                label="Vehicle Type"
                options={driveTypeOptions}
                value={driveType}
                onChange={setdriveType}
              />
              <TextField
                label="Engine Type"
                value={engineType}
                onChange={setEngineType}
                autoComplete="off"
              />
              <TextField
                label="Note"
                value={note}
                onChange={setNote}
                autoComplete="off"
              />
            </InlineStack>
          )}
        </BlockStack>
      </Card>

      <Card padding="0">
        <Tabs tabs={tabs} selected={0} onSelect={() => {}} />
        <div style={{ padding: "16px" }}>
          <IndexTable
            resourceName={{ singular: "product", plural: "products" }}
            itemCount={products.length}
            headings={[{ title: "ID" }, { title: "Title" }]}
            selectable={false}
          >
            {products.map((product, index) => (
              <IndexTable.Row
                key={product.legacyResourceId}
                id={product.legacyResourceId}
                position={index}
              >
                <IndexTable.Cell>
                  <Text as="span" variant="bodyMd">
                    {product.legacyResourceId}
                  </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Text as="span" variant="bodyMd" fontWeight="medium">
                    {product.title}
                  </Text>
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        </div>
      </Card>
    </Page>
  );
}
