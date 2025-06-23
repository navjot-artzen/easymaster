'use client';

import { useState } from 'react';
import {
    Page,
    Card,
    Button,
    DropZone,
    Text,
    BlockStack,
    Banner,
} from '@shopify/polaris';

export default function UploadCsvPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleDropZoneDrop = (_dropFiles: File[], acceptedFiles: File[]) => {
        const selected = acceptedFiles[0];
        if (selected && selected.type === 'text/csv') {
            setFile(selected);
            setError('');
        } else {
            setError('Only CSV files are allowed.');
            setFile(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError('');
        setSuccess('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload-csv', {
                method: 'POST',
                body: formData,
            });

            const result = await res.json();
            if (res.ok) {
                setSuccess('CSV file uploaded successfully.');
                setFile(null);
            } else {
                setError(result.message || 'Failed to upload.');
            }
        } catch (err) {
            setError('Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Page title="Upload CSV File">
            <Card>
                <BlockStack gap="400">
                    <DropZone accept=".csv" onDrop={handleDropZoneDrop}>
                        {file ? (
                            <Text as='p' variant="bodySm">{file.name}</Text>
                        ) : (
                            <DropZone.FileUpload />
                        )}
                    </DropZone>

                    {error && <Banner tone="critical" title="Error">{error}</Banner>}
                    {success && <Banner tone="success" title="Success">{success}</Banner>}

                    <Button onClick={handleUpload} disabled={!file || uploading} loading={uploading}>
                        Upload CSV
                    </Button>
                </BlockStack>
            </Card>
        </Page>
    );
}
