"use client";

import {
  Page,
  IndexTable,
  Spinner,
  BlockStack,
  Text,
  Select,
  InlineStack,
  Pagination,
} from "@shopify/polaris";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface CarEntry {
  id: string;
  startFrom: string;
  end: string;
  make: string;
  model: string;
  vehicleType?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProductCarsPage() {
  const { id } = useParams();
  const [entries, setEntries] = useState<CarEntry[]>([]);
  const [productTitle, setProductTitle] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;
  const router = useRouter();
  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/product/${id}/cars?page=${currentPage}&pageSize=${pageSize}`,
        );
        if (!res.ok) throw new Error("Failed to fetch product cars");
        const data = await res.json();
        setEntries(data.entries || []);
        setProductTitle(data.productTitle || null);
        setTotalPages(Math.ceil(data.totalCount / pageSize));
      } catch (error) {
        console.error("Error fetching cars:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCars();
  }, [id, currentPage]);

  const normalize = (str: string) => str?.toLowerCase().replace(/[\s-]/g, "");

  const filteredEntries = entries.filter((entry) => {
    if (filterType === "ALL") return true;
    return normalize(entry.vehicleType || "") === normalize(filterType);
  });

  return (
    <Page
      title={productTitle || "Product Cars"}
      backAction={{ content: "Back", onAction: () => router.push("/database") }}
    >
      <BlockStack gap="400">
        {/* <InlineStack align="start">
          <div style={{ maxWidth: 250 }}>
            <Select
              label="Filter by Vehicle Type"
              labelHidden
              options={[
                { label: 'All', value: 'ALL' },
                { label: '2 Wheeler', value: '2 Wheeler' },
                { label: '4 Wheeler', value: '4 Wheeler' },
              ]}
              onChange={(val) => setFilterType(val)}
              value={filterType}
            />
          </div>
        </InlineStack> */}

        {loading ? (
          <BlockStack align="center" inlineAlign="center" gap="400">
            <Spinner accessibilityLabel="Loading cars" size="large" />
          </BlockStack>
        ) : filteredEntries.length === 0 ? (
          <Text as="p">No matching vehicles found for this product.</Text>
        ) : (
          <>
            <IndexTable
              resourceName={{ singular: "Car", plural: "Cars" }}
              itemCount={filteredEntries.length}
              headings={[
                { title: "Year" },
                { title: "Make" },
                { title: "Model" },
                { title: "Vehicle_Type" },
              ]}
              selectable={false}
            >
              {filteredEntries.map((entry, index) => (
                <IndexTable.Row id={entry.id} key={entry.id} position={index}>
                  <IndexTable.Cell>{`${entry.startFrom} - ${entry.end}`}</IndexTable.Cell>
                  <IndexTable.Cell>{entry.make}</IndexTable.Cell>
                  <IndexTable.Cell>{entry.model}</IndexTable.Cell>
                  <IndexTable.Cell>
                    {entry.vehicleType
                      ? entry.vehicleType.replace(/(^\w|\s\w)/g, (m) =>
                          m.toUpperCase(),
                        )
                      : "-"}
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
            <div style={{ marginTop: "16px" }}>
              <Pagination
                hasPrevious={currentPage > 1}
                onPrevious={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                hasNext={currentPage < totalPages}
                onNext={() => setCurrentPage((p) => p + 1)}
              />
            </div>
          </>
        )}
      </BlockStack>
    </Page>
  );
}
