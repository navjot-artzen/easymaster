"use client";

import { useState, useEffect, Suspense } from "react";
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
import { useAppBridge } from "@shopify/app-bridge-react";
import { useRouter } from "next/navigation";

interface UploadedFile {
  fileName: string;
  url: string;
  description?: string;
  totalRecords?: string;
  active: boolean;
  chunkSize?: number;
  totalChunks?: number;
  processedChunks?: number;
  isProcessed: boolean;
}

interface CsvProgress {
  totalRecords: number;
  chunkSize: number;
  totalChunks: number;
  processedChunks: number;
  remainingChunks: number;
  progressPercent: number;
}

function UploadForm({
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
          fileName: result.name,
          url: result.url,
          description: `Uploaded: ${result.name}`,
          active: result.active || false,
          isProcessed: result.isProcessed || false,
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

export default function UploadCsvPage() {
  const router = useRouter();
  const [formVisible, setFormVisible] = useState(false);
  const [hasFiles, setHasFiles] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [progress, setProgress] = useState<CsvProgress | null>(null);
  const [tableLoading, setTableLoading] = useState(true);

  const fetchProgress = async () => {
    try {
      const res = await fetch("/api/csv-fetch/progress");
      const json = await res.json();
      if (json.status === "success") {
        setProgress(json.data);
      }
    } catch (err) {
      console.error("Failed to load CSV progress:", err);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  return (
    <Page
      title="Upload CSV File"
      backAction={{ content: "Back", onAction: () => router.push("/database") }}
      primaryAction={
        hasFiles && !formVisible
          ? {
            content: "New File",
            onAction: () => setFormVisible(true),
          }
          : undefined
      }
    >
      <Suspense fallback={<div>Loading...</div>}>
        <UploadForm
          visible={!hasFiles || formVisible}
          onUploadSuccess={() => setFormVisible(false)}
          setHasFiles={setHasFiles}
          setUploadedFiles={setUploadedFiles}
          refreshProgress={fetchProgress}
          setTableLoading={setTableLoading}
        />
      </Suspense>

      {!formVisible && hasFiles && (
        <Card>

          <IndexTable
            resourceName={{ singular: "file", plural: "files" }}
            itemCount={uploadedFiles.length}
            headings={[
              { title: "File Name" },
              { title: "Description" },
              { title: "Processed Data" },
              { title: "Total Data" },
              { title: "Active" },
              { title: "isProcessed" },
              { title: "Action" },
            ]}
            selectable={false}
          >
            {tableLoading ? (
              <IndexTable.Row id="loading" key="loading" position={0}>
                <IndexTable.Cell colSpan={7}>
                  <BlockStack align="center" inlineAlign="center" gap="400">
                    <Spinner accessibilityLabel="Loading table data..." size="large" />
                  </BlockStack>
                </IndexTable.Cell>
              </IndexTable.Row>
            ) : (
              uploadedFiles.map((file, index) => (
                <IndexTable.Row
                  id={file.fileName}
                  key={file.fileName}
                  position={index}
                >
                  <IndexTable.Cell>{file.fileName}</IndexTable.Cell>
                  <IndexTable.Cell>
                    {file.active ? "In Process" : "N/A"}
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    {file?.active && file.processedChunks != null && file.chunkSize != null
                      ? `${file.processedChunks * file.chunkSize} records`
                      : "0 records"}
                  </IndexTable.Cell>
                  <IndexTable.Cell>{file?.totalRecords}</IndexTable.Cell>
                  <IndexTable.Cell>
                    <Badge tone={file.active ? "success" : "warning"}>
                      {file.active ? "Active" : "Inactive"}
                    </Badge>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    {file.isProcessed ? "true" : "false"}
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Button url={file.url} target="_blank" external size="slim">
                      View
                    </Button>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))
            )}
          </IndexTable>


        </Card>
      )}
    </Page>
  );
}
