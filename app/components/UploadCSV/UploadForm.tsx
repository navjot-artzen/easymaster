import { useAppBridge } from "@shopify/app-bridge-react";
import { useState } from "react";
import {
  Card,
  Button,
  DropZone,
  Text,
  BlockStack,
  Banner,
  SkeletonBodyText,
  SkeletonDisplayText,
  Spinner,
  InlineStack,
} from "@shopify/polaris";
import { UploadedFile } from "@/types/interfaces";

export function UploadForm({
  visible,
  onUploadSuccess,
  setHasFiles,
  setUploadedFiles,
  loading,
}: {
  visible: boolean;
  onUploadSuccess: () => void;
  setHasFiles: (value: boolean) => void;
  setUploadedFiles: (
    files: UploadedFile[] | ((prev: UploadedFile[]) => UploadedFile[]),
  ) => void;
  loading: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const app = useAppBridge();
  const handleDropZoneDrop = (_: File[], accepted: File[]) => {
    const selected = accepted[0];
    if (selected && selected.type === "text/csv") {
      setFile(selected);
      setError("");
    } else {
      setError("Only CSV files are allowed.");
      setFile(null);
    }
  };

  const handleUpload = async () => {
    const toast = app.toast;
    const shop = app?.config?.shop;

    if (!file || !shop) {
      setError("Missing file or shop information.");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("shop", shop);

    try {
      const res = await fetch("/api/upload-csv", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        const newEntry: UploadedFile = {
          id: result.csvFile.id,
          fileName: result.csvFile.name,
          url: result.csvFile.url,
          active: result.csvFile.active || false,
          isProcessed: result.csvFile.isProcessed || false,
          totalRecords: result.csvFile.totalRecords || "N/A",
           processedRecords: result.csvFile.processedRecords
        };
        setUploadedFiles((prev) =>
          Array.isArray(prev) ? [newEntry, ...prev] : [newEntry],
        );
        setHasFiles(true);
        toast.show("CSV file uploaded successfully.");
        setFile(null);
        onUploadSuccess();
      } else {
        setError(result.message || "Failed to upload.");
      }
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <BlockStack gap="400">
          <SkeletonDisplayText size="medium" />
          <SkeletonBodyText lines={3} />
          <Spinner accessibilityLabel="Loading" size="large" />
        </BlockStack>
      </Card>
    );
  }

  if (!visible) return null;

  return (
    <Card>
      <BlockStack gap="400">
        <Text variant="headingMd" as="h2">
          Welcome to the Eparts master CSV importer!
        </Text>
        <DropZone accept=".csv" onDrop={handleDropZoneDrop}>
          {file ? (
            <Text as="p" variant="bodyMd">
              {file.name}
            </Text>
          ) : (
            <DropZone.FileUpload actionHint="Drop CSV file here or click to upload" />
          )}
        </DropZone>

        {error && (
          <Banner tone="critical" title="Error">
            {error}
          </Banner>
        )}
        <InlineStack gap="400" wrap={false} blockAlign="center">
          <Button onClick={onUploadSuccess} variant="secondary" tone="critical">
            Cancel
          </Button>

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            loading={uploading}
            variant="primary"
          >
            Upload CSV
          </Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}
