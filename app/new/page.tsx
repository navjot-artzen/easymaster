// 'use client';

// import { Page, Card, Text, Layout, Button } from '@shopify/polaris';

// export default function NewPage() {
//   return (
//     <Page title="New Page">
//       <Layout>
//         <Layout.Section>
//           <Card>
//             <Text variant="headingMd" as="h2">
//               Welcome to the Eparts master CSV importer!
//             </Text>
//             <Text as="p">
//               This is a dummy page created using Shopify Polaris components.
//             </Text>
//             <Button onClick={() => alert('Button clicked')}>Click me</Button>
//           </Card>
//         </Layout.Section>
//       </Layout>
//     </Page>
//   );
// }

"use client";

import { useState } from "react";
import {
  Page,
  Card,
  Text,
  Layout,
  Button,
  DropZone,
  Banner,
  Spinner,
} from "@shopify/polaris";
import Papa from "papaparse";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://your-project.supabase.co", // ✅ Replace with your Supabase project URL
  "your-anon-key", // ✅ Replace with your Supabase public anon key
);

export default function NewPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleDropZoneDrop = (_: any, acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
    setMessage(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<any>) => {
        try {
          const { data, error } = await supabase
            .from("your_table")
            .insert(results.data);

          if (error) {
            setMessage(`Upload failed: ${error.message}`);
          } else {
            setMessage("CSV data uploaded successfully!");
          }
        } catch (err: any) {
          setMessage(`Unexpected error: ${err.message}`);
        } finally {
          setUploading(false);
        }
      },
    });
  };

  return (
    <Page title="CSV Upload">
      <Layout>
        <Layout.Section>
          <Card>
            <Text variant="headingMd" as="h2">
              Welcome to the Eparts master CSV importer!
            </Text>
            <DropZone accept=".csv" type="file" onDrop={handleDropZoneDrop}>
              <DropZone.FileUpload actionTitle="Upload CSV File" />
              {file && <Text as="p">File: {file.name}</Text>}
            </DropZone>

            <br />
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? "Uploading..." : "Upload to Supabase"}
            </Button>

            {uploading && (
              <Spinner accessibilityLabel="Uploading CSV" size="small" />
            )}
            {message && (
              <Banner
                title={message}
                tone={message.includes("failed") ? "critical" : "success"}
              />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
