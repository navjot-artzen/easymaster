'use client';

import { useState, useEffect, Suspense } from 'react';
import {
    Page,
    Card,
    Button,
    DropZone,
    Text,
    BlockStack,
    Banner,
    InlineStack,
    SkeletonBodyText,
    SkeletonDisplayText,
    Spinner,
} from '@shopify/polaris';
import { useSearchParams } from 'next/navigation';

function UploadForm() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true); // Loader for fetching latest upload
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploadedFileInfo, setUploadedFileInfo] = useState<null | {
        fileName: string;
        url: string;
        description: string;
    }>(null);

    const searchParams = useSearchParams();
    const shop = searchParams.get('shop');

    useEffect(() => {
        if (shop) {
            setLoading(true);
            fetch(`/api/upload-csv?shop=${shop}`)
                .then(res => res.json())
                .then(data => {
                    if (data?.url) {
                        setUploadedFileInfo({
                            fileName: data.name,
                            url: data.url,
                            description: generateDescription(data.name),
                        });
                    }
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [shop]);

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

    const generateDescription = (fileName: string) => {
        const desc = `Uploaded: ${fileName}`;
        return desc.length > 50 ? desc.slice(0, 50) + '...' : desc;
    };

    const handleUpload = async () => {
        if (!file || !shop) {
            setError('Missing file or shop information.');
            return;
        }

        setUploading(true);
        setError('');
        setSuccess('');
        setUploadedFileInfo(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('shop', shop);

        try {
            const res = await fetch('/api/upload-csv', {
                method: 'POST',
                body: formData,
            });

            const result = await res.json();

            if (res.ok) {
                setUploadedFileInfo({
                    fileName: result.name,
                    url: result.url,
                    description: generateDescription(result.name),
                });
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

    return uploadedFileInfo ? (
        <Card>
            <BlockStack gap="400">
                <Text variant="headingLg" as="h2">
            📥 Here&apos;s What You Just Uploaded
                </Text>
                <Text variant="headingMd" as="h3">
                    {uploadedFileInfo.fileName}
                </Text>
                <Text as="p" variant="bodyLg">
                    {uploadedFileInfo.description}
                </Text>
                <InlineStack>
                    <Button url={uploadedFileInfo.url} target="_blank" external>
                        View File
                    </Button>
                </InlineStack>
            </BlockStack>
        </Card>
    ) : (
        <Card>
            <BlockStack gap="400">
                <DropZone accept=".csv" onDrop={handleDropZoneDrop}>
                    {file ? (
                        <Text as="p" variant="bodyMd">
                            {file.name}
                        </Text>
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
    );
}

export default function UploadCsvPage() {
    return (
        <Page title="Upload CSV File">
            <Suspense fallback={<div>Loading...</div>}>
                <UploadForm />
            </Suspense>
        </Page>
    );
}
