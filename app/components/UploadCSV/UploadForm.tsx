import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";
import {
  Page,
  Card,
  Button,
  DropZone,
  Text,
  BlockStack,
  Banner,
  SkeletonBodyText,
  SkeletonDisplayText,
  Spinner,
  IndexTable,
  Badge,
} from "@shopify/polaris";
import { UploadedFile } from "@/types/interfaces";

export function UploadForm({
  visible,
  onUploadSuccess,
  setHasFiles,
  setUploadedFiles,
  refreshProgress,
  setTableLoading,
}: {
  visible: boolean;
  onUploadSuccess: () => void;
  setHasFiles: (value: boolean) => void;
  setUploadedFiles: (
    files: UploadedFile[] | ((prev: UploadedFile[]) => UploadedFile[])
  ) => void;
  refreshProgress: () => void;
  setTableLoading: (value: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const app = useAppBridge();

  const fetchFiles = async () => {
    setLoading(true);
    setTableLoading(true);
    const shop = app?.config?.shop;
    if (shop) {
      const res = await fetch(`/api/upload-csv?shop=${shop}`);
      const data = await res.json();
      setUploadedFiles(data);
      setHasFiles(data.length > 0);
    }
    setLoading(false);
    setTableLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

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
          id: result.id || crypto.randomUUID(), 
          fileName: result.name,
          url: result.url,
          description: `Uploaded: ${result.name}`,
          active: result.active ?? false,
          isProcessed: result.isProcessed ?? false,
          error: result.error ?? null, 
        };
        setUploadedFiles((prev) =>
          Array.isArray(prev) ? [newEntry, ...prev] : [newEntry]
        );
        setHasFiles(true);
        toast.show("CSV file uploaded successfully.");
        setFile(null);
        onUploadSuccess();
        refreshProgress();
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

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          loading={uploading}
        >
          Upload CSV
        </Button>
      </BlockStack>
    </Card>
  );
}
