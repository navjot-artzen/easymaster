'use client';

import { useState } from 'react';
import {
    Page,
    Card,
    TextField,
    Spinner,
    Text,
    Button,
    InlineStack,
    Grid,
    BlockStack,
} from '@shopify/polaris';

export default function VinSearchPage() {
    const [vin, setVin] = useState('');
    const [vehicleData, setVehicleData] = useState<Record<string, string> | null>(null);
    const [vehicleDatabygpt, setVehicleDatabyGpt] = useState<Record<string, string> | null>(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [inputError, setInputError] = useState<string | undefined>(undefined);

    const handleSearch = async () => {
        setSearched(false);
        setVehicleData(null);

        if (!vin.trim()) {
            setInputError('VIN is required');
            return;
        }

        setInputError(undefined);
        setLoading(true);

        try {
            const response = await fetch(`/api/search-by-vin?vin=${vin}`);
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            const result = await response.json();
            setVehicleDatabyGpt(result.gptSummary || null)
            setVehicleData(result.decodedData || null);
        } catch (error) {
            console.error('VIN Search Error:', error);
            setVehicleData(null);
        } finally {
            setLoading(false);
            setSearched(true);
        }
    };
    console.log("vehicle information:", vehicleDatabygpt)
    const handleClear = () => {
        setVin('');
        setVehicleData(null);
        setInputError(undefined);
        setSearched(false);
    };

    return (
        <Page title="Search by VIN">
            <div style={{ display: 'flex', justifyContent: 'start' }}>
                <div style={{ maxWidth: 1000, width: '100%' }}>
                    <Card>
                        <InlineStack align="start" gap="200" wrap={false}>
                            <div style={{ flexGrow: 1 }}>
                                <TextField
                                    labelHidden
                                    label="VIN"
                                    value={vin}
                                    onChange={setVin}
                                    autoComplete="off"
                                    placeholder="Enter VIN number"
                                    error={inputError}
                                />
                            </div>
                            <div style={{ alignSelf: 'flex-start' }}>
                                <Button onClick={handleSearch}>Search</Button>
                            </div>
                            <div style={{ alignSelf: 'flex-start' }}>
                                <Button tone="critical" onClick={handleClear}>Clear</Button>
                            </div>
                        </InlineStack>
                    </Card>

                </div>
            </div>

            <div style={{ height: '24px' }} />

            {loading && (
                <Card>
                    <div style={{ padding: '16px', textAlign: 'center' }}>
                        <Spinner accessibilityLabel="Loading" size="large" />
                    </div>
                </Card>
            )}

            {!loading && vehicleData && vehicleDatabygpt && (
                <div style={{ marginBottom: "50px" }}>
                    <Card>
                        <BlockStack gap="400">
                            <Text as="h2" variant="headingLg">Vehicle Information</Text>
                            <Grid columns={{ xs: 1, sm: 2, md: 2, lg: 2 }}>
                                {[
                                    'make',
                                    'model',
                                    'year',
                                    'trim',
                                    'fuelType',
                                    'transmission',
                                    'driveType',
                                    'engine',
                                    'bodyClass',
                                ].map((field) =>
                                    vehicleDatabygpt[field] ? (
                                        <BlockStack key={field}>
                                            <Text as="p" fontWeight="semibold">  {field.charAt(0).toUpperCase() + field.slice(1).toLowerCase()}
                                            </Text>
                                            <Text as="p">{vehicleDatabygpt[field]}</Text>
                                        </BlockStack>
                                    ) : null
                                )}
                            </Grid>

                            <details style={{ marginTop: '1rem' }}>
                                <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                                    Vehicle Information by NHTSA
                                </summary>
                                <div style={{ marginTop: '1rem' }}>
                                    <Grid columns={{ xs: 1, sm: 2, md: 2, lg: 2 }}>
                                        {Object.entries(vehicleData).map(([key, value]) => {
                                            if (
                                                [

                                                    'Error Code',
                                                    'Error Text',
                                                ].includes(key)
                                            ) return null;

                                            return (
                                                <BlockStack key={key} gap="100">
                                                    <Text as="p" fontWeight="semibold">{key}</Text>
                                                    <Text as="p">{value || 'N/A'}</Text>
                                                </BlockStack>
                                            );
                                        })}
                                    </Grid>
                                </div>
                            </details>
                        </BlockStack>
                    </Card>
                </div>

            )}

            {!loading && searched && !vehicleData && !inputError && (
                <Card>
                    <div style={{ padding: '16px' }}>
                        <Text as="p" tone="subdued">No vehicle found for this VIN.</Text>
                    </div>
                </Card>
            )}
        </Page>
    );
}
