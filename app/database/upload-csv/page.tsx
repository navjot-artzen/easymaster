"use client";

import { useState, useEffect } from "react";
import { Page } from "@shopify/polaris";
import { useRouter } from "next/navigation";
import { UploadForm } from "@/app/components/UploadCSV/UploadForm";
import { CsvProgress, UploadedFile } from "@/types/interfaces";
import { UploadedFilesTable } from "@/app/components/TableCard/CsvTable";
import { deleteCSVFile, updateCsvFile } from "@/utils/API/csvApi";
import { useAppBridge } from "@shopify/app-bridge-react";

export default function UploadCsvPage() {
  const router = useRouter();
  const [formVisible, setFormVisible] = useState(false);
  const [hasFiles, setHasFiles] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [progress, setProgress] = useState<CsvProgress | null>(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const app = useAppBridge();
  const fetchFiles = async () => {
    setLoading(true);
    setTableLoading(true);
    const shop = app?.config?.shop;
    if (shop) {
      const res = await fetch(`/api/upload-csv?shop=${shop}`);
      const data = await res.json();
      console.log(data, "/database/upload-csv");
      setUploadedFiles(data);
      console.log("csv data:",data)
      setHasFiles(data.length > 0);
    }
    setLoading(false);
    setTableLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleCSVUpdate = async ({
    csvFileId,
    action,
  }: {
    csvFileId: string;
    action: string;
  }) => {
    const toast = app.toast;
    try {
      await updateCsvFile(csvFileId, action);
      await fetchFiles();
      toast.show("CSV file updated successfully.");
    } catch (error) {
      toast.show("CSV file update Error.", { isError: true });
    }
  };

  const handleCSVDelete = async (csvFileId: string) => {
    const toast = app.toast;
    try {
      await deleteCSVFile(csvFileId);
      await fetchFiles();
      toast.show("CSV file deleted successfully.");
    } catch (error) {
      toast.show("CSV file update Error.", { isError: true });
    }
  };

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
    fullWidth
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
      <UploadForm
        loading={loading}
        visible={!hasFiles || formVisible}
        onUploadSuccess={() => setFormVisible(false)}
        setHasFiles={setHasFiles}
        setUploadedFiles={setUploadedFiles}
      />

      {!formVisible && hasFiles && (
        <UploadedFilesTable
          files={uploadedFiles}
          loading={tableLoading}
          onUpdate={handleCSVUpdate}
          onDelete={handleCSVDelete}
        />
      )}
    </Page>
  );
}
