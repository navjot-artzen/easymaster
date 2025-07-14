import { NextResponse } from "next/server";
import { parse } from 'csv-parse/sync';
import prisma from "@/lib/prisma";
import redis from "@/lib/upstash/redis";
import { getCsvData } from "@/utils/csv";
import { chunkSize } from "@/utils/config/constant";
import { findSessionByShop } from "@/lib/db/session-storage";
import { getProductByHandle } from "@/lib/shopify/api";
import { makeModalEntry } from "@/lib/db/db-function";

type APIResponse = {
  status: "success" | "failure";
  data?: any;
  message?: string;
  error?: string;
};

type Product = {
  title: string;
  gid: string;
  legacyResourceId: string;
};

type Entry = {
  addedProducts?: Product[];
  make: string;
  model: string;
  startFrom: string;
  end: string;
  shop: string;
  products: Product[];
};

function mergeDuplicateData(data: any[]) {
  const mergedMap = new Map();

  // Create a unique key for each combination of make, model, startFrom, end, and shop
  function getKey(item: { make: any; model: any; startFrom: any; end: any; shop: any; }) {
    return `${item.make}_${item.model}_${item.startFrom}_${item.end}_${item.shop}`;
  }

  // Process each item in the input array
  data.forEach(item => {
    const key = getKey(item);

    if (mergedMap.has(key)) {
      // If we've seen this combination before, merge the products
      const existingItem = mergedMap.get(key);
      const existingProducts = existingItem.products;
      const newProducts = item.products;

      // Create a map of existing products by gid for quick lookup
      const productMap = new Map();
      existingProducts.forEach((product: { gid: any; }) => {
        productMap.set(product.gid, product);
      });

      // Add new products that aren't already in the map
      newProducts.forEach((product: { gid: any; }) => {
        if (!productMap.has(product.gid)) {
          productMap.set(product.gid, product);
        }
      });

      // Update the products array with the merged set
      existingItem.products = Array.from(productMap.values());
    } else {
      // First time seeing this combination, add it to the map
      // First deduplicate products in the original item
      const productMap = new Map();
      item.products.forEach((product: { gid: any; }) => {
        productMap.set(product.gid, product);
      });

      mergedMap.set(key, {
        ...item,
        products: Array.from(productMap.values())
      });
    }
  });

  // Convert the map back to an array
  return Array.from(mergedMap.values());
}

const removeInvalidProducts = (arr: Product[]): Product[] => {
  return arr.filter(obj => {
    // Remove if it's empty or all values are undefined
    if (Object.keys(obj).length === 0) return false;

    const allValuesAreUndefined = Object.values(obj).every(value => value === undefined);
    return !allValuesAreUndefined;
  });
};

const getUnaddedProducts = async (entries: Entry[]) => {
  const results: Entry[] = [];

  for (const entry of entries) {
    const allLegacyIds = entry.products.map(p => p.legacyResourceId);
    const existing = await prisma.productsEntry.findFirst({
      where: {
        make: entry.make,
        model: entry.model,
        startFrom: entry.startFrom,
        end: entry.end,
        shop: entry.shop,
        products: {
          some: {
            legacyResourceId: {
              in: allLegacyIds,
            },
          },
        },
      },
      select: {
        id: true,
        products: {
          select: {
            legacyResourceId: true,
          },
        },
      },
    });

    if (!existing) {
      results.push(entry);
    }

    const existingIds = new Set(
      existing?.products.map(p => p.legacyResourceId) ?? []
    );

    const unaddedProducts = entry.products.filter(
      p => !existingIds.has(p.legacyResourceId)
    );

    console.log(entry.make, entry.model, entry.startFrom, "***************", JSON.stringify(existing), "existing", "\n")
    console.log(entry.make, entry.model, entry.startFrom, "***************", JSON.stringify(existingIds), "existingIds", "\n")
    console.log(entry.make, entry.model, entry.startFrom, "***************", JSON.stringify(unaddedProducts), "unaddedProducts", "\n")

    if (existing && unaddedProducts.length > 0) {
      await prisma.productsEntry.update({
        where: {
          id: existing.id
        },
        data: {
          products: entry.products,
          updatedAt: new Date(),
        },
      });
    }
  }

  return results;
};

async function processChunk(chunk: any[], shop: string, accessToken: string) {
  const productData = await Promise.all(
    chunk.map(async (record) => {
      const products = await getProductByHandle(shop, accessToken, record['Part']);
      console.log(products, "products")
      const cleanedProducts = removeInvalidProducts(products);
      console.log(cleanedProducts, "cleanedProducts***************");
      const formattedProducts = cleanedProducts.map((p: any) => ({
        title: p.title,
        gid: p.gid,
        legacyResourceId: p.legacyResourceId,
      }));

      // Create modal entry if needed
      await makeModalEntry(record['Brand'], record['Model'], record['Year'], record['Year']);

      return {
        make: record['Brand'] || null,
        model: record['Model'] || null,
        startFrom: record['Year'] || null,
        end: record['Year'] || null,
        shop,
        products: formattedProducts,
      };
    })
  );
  const mergedData = mergeDuplicateData(productData);
  console.log(JSON.stringify(productData), "productData", "\n")
  console.log(JSON.stringify(mergedData), "mergedData", "\n", "\n")
  // Deduplicate before inserting

  const dupedData = await getUnaddedProducts(mergedData);
  console.log(JSON.stringify(dupedData), "dupedData")
  if (dupedData.length > 0) {
    await prisma.productsEntry.createMany({
      data: dupedData,
    });
  }
}

export async function GET(req: Request) {
  try {
    const csvData = await getCsvData();
    const jsonData = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });
    return NextResponse.json<APIResponse>({
      status: "success",
      data: jsonData,
    });
  } catch (error) {
    console.error('CSV processing failed:', error);
    return NextResponse.json<APIResponse>({
      status: "failure",
      error: 'Processing failed'
    });
  }
}

export async function POST(req: Request) {
  try {
    console.log("Cron triggered at:", new Date().toISOString());

    // 1. Find the active file (only one should be active at a time)
    const activeFile = await prisma.csvFile.findFirst({
      where: { active: true, isProcessed: false },
      orderBy: { createdAt: 'asc' },
    });

    if (!activeFile) {
      return NextResponse.json({
        status: "failure",
        message: "No active file to process",
      });
    }

    // 2. Fetch CSV data (assuming from Supabase or similar)
    const csvData = await fetch(activeFile.url, { cache: 'no-store' }).then((res) => res.text());

    // 3. Parse CSV with explicit error handling
    let records;
    try {
      records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
      });
    } catch (parseError: any) {
      console.error("CSV parsing error:", parseError);
      await prisma.csvFile.update({
        where: { id: activeFile.id },
        data: {
          error: `CSV parse error: ${parseError?.message || parseError.toString()}`,
        },
      });

      return NextResponse.json({
        status: "failure",
        error: `CSV parsing failed: ${parseError.message || "Unknown error"}`,
      });
    }

    const totalChunks = Math.ceil(records.length / chunkSize);

    // 4. Get current chunk progress from Redis
    const redisKey = `csv_chunk_index_${activeFile.id}`;
    const lastProcessedChunk = (await redis.get<number>(redisKey)) ?? 0;
    console.log(lastProcessedChunk, "lastProcessedChunk")


    if (lastProcessedChunk >= totalChunks) {
      // Mark active file as complete
      await prisma.csvFile.update({
        where: { id: activeFile.id },
        data: {
          active: false,
          processedRecords: activeFile.totalRecords,
          isProcessed: true,
        },
      });

      // Find next file to activate
      const nextFile = await prisma.csvFile.findFirst({
        where: { shop: activeFile.shop, active: false, isProcessed: false },
        orderBy: { createdAt: 'asc' },
      });

      if (nextFile) {
        await prisma.csvFile.update({
          where: { id: nextFile.id },
          data: {
            active: true,
            isProcessed: false,
          },
        });
        const _redisKey = `csv_chunk_index_${nextFile.id}`;
        // Reset Redis index for next file
        await redis.set(_redisKey, 1);
      }

      return NextResponse.json({
        status: "success",
        message: "Finished current file. Moved to next.",
      });
    }

    // 6. Process next chunk
    const chunkStart = lastProcessedChunk * chunkSize;
    const chunk = records.slice(chunkStart, chunkStart + chunkSize);
    console.log(`Processing chunk ${lastProcessedChunk + 1}/${totalChunks}`, chunk);
    const session = await findSessionByShop(activeFile.shop);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Session or access token not found.' }, { status: 402 });
    }

    await processChunk(chunk, activeFile.shop, session?.accessToken);

    await prisma.csvFile.update({
      where: { id: activeFile.id },
      data: {
        processedRecords: activeFile.processedRecords + chunk.length,
      },
    });

    // 7. Save progress
    await redis.set(redisKey, lastProcessedChunk + 1);

    return NextResponse.json({
      status: "success",
      data: {
        fileId: activeFile.id,
        processedChunk: lastProcessedChunk + 1,
        totalChunks,
      },
    });
  } catch (error: any) {
    console.error("CSV processing failed:", error);
    return NextResponse.json({
      status: "failure",
      error: "Processing failed",
    });
  }
}
