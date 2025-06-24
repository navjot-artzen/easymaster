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
    IndexTable,
} from '@shopify/polaris';
import { useSearchParams } from 'next/navigation';
import { useAppBridge } from '@shopify/app-bridge-react';
import { useRouter } from 'next/navigation';

function UploadForm({ visible }: { visible: boolean }) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<{
        fileName: string;
        url: string;
        description: string;
    }[]>([]);
    const app = useAppBridge();

    useEffect(() => {
        const shop = app?.config?.shop;
        if (shop) {
            setLoading(true);
            fetch(`/api/upload-csv?shop=${shop}`)
                .then((res) => res.json())
                .then((data) => {
                    if (Array.isArray(data)) {
                        const files = data.map((d) => ({
                            fileName: d.name,
                            url: d.url,
                            description: generateDescription(d.name),
                        }));
                        setUploadedFiles(files);
                    } else if (data?.url) {
                        setUploadedFiles([
                            {
                                fileName: data.name,
                                url: data.url,
                                description: generateDescription(data.name),
                            },
                        ]);
                    }
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [app]);

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
        const shop = app?.config?.shop;
        if (!file || !shop) {
            setError('Missing file or shop information.');
            return;
        }

        setUploading(true);
        setError('');
        setSuccess('');

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
                setUploadedFiles((prev) => [
                    {
                        fileName: result.name,
                        url: result.url,
                        description: generateDescription(result.name),
                    },
                    ...prev,
                ]);
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

    return (
        <BlockStack gap="400">
            <Text variant="headingMd" as="h2">
                Welcome to the Eparts master CSV importer!
            </Text>
            {uploadedFiles.length > 0 && (
                <Card>
                    <IndexTable
                        resourceName={{ singular: 'file', plural: 'files' }}
                        itemCount={uploadedFiles.length}
                        headings={[
                            { title: 'File Name' },
                            { title: 'Description' },
                            { title: 'Action' },
                        ]}
                        selectable={false}
                    >
                        {uploadedFiles.map((file, index) => (
                            <IndexTable.Row
                                id={file.fileName}
                                key={file.fileName}
                                position={index}
                            >
                                <IndexTable.Cell>{file.fileName}</IndexTable.Cell>
                                <IndexTable.Cell>{file.description}</IndexTable.Cell>
                                <IndexTable.Cell>
                                    <Button
                                        url={file.url}
                                        target="_blank"
                                        external
                                        size="slim"
                                    >
                                        View
                                    </Button>
                                </IndexTable.Cell>
                            </IndexTable.Row>
                        ))}
                    </IndexTable>
                </Card>
            )}
            {visible && (
                <Card>
                    <BlockStack gap="400">
                        <DropZone accept=".csv" onDrop={handleDropZoneDrop}>
                            {file ? (
                                <Text as="p" variant="bodyMd">
                                    {file.name}
                                </Text>
                            ) : (
                                <DropZone.FileUpload actionHint="Drop CSV file here or click to upload" />
                            )}
                        </DropZone>
                        {error && <Banner tone="critical" title="Error">{error}</Banner>}
                        {success && <Banner tone="success" title="Success">{success}</Banner>}
                        <Button onClick={handleUpload} disabled={!file || uploading} loading={uploading}>
                            Upload CSV
                        </Button>
                    </BlockStack>
                </Card>
            )}
        </BlockStack>
    );
}

export default function UploadCsvPage() {
    const router = useRouter();
    const [formVisible, setFormVisible] = useState(false);

    return (
        <Page
            title="Upload CSV File"
            backAction={{ content: 'Back', onAction: () => router.push('/database') }}
            primaryAction={{
                content: 'New File',
                onAction: () => setFormVisible(true),
            }}
        >
            <Suspense fallback={<div>Loading...</div>}>
                <UploadForm visible={formVisible} />
            </Suspense>
        </Page>
    );
}
