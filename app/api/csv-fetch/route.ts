import { NextResponse } from "next/server";
import { parse } from 'csv-parse/sync';
// import prisma from "@/lib/db/prisma-connect";
import prisma from "../../../lib/prisma";

import redis from "@/lib/upstash/redis";
import { getCsvData } from "@/utils/csv";

type APIResponse = {
  status: "success" | "failure";
  data?: any;
  message?: string;
  error?: string;
};

async function processChunk(chunk: any[]) {
  const productData = chunk.map(record => ({
    handle: record['Part'],
    compatibility: record['Engine Type'],
    make: record['Brand'] || null,
    model: record['Model'] || null,
    year: record['Year'] || null,
  }));

  await prisma.productYmm.createMany({
    data: productData,
  })
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

    const csvData = await getCsvData();

    // Parse CSV
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    });

    const chunkSize = 10;
    const totalChunks = Math.ceil(records.length / chunkSize);

    // Get last processed chunk index from Redis
    const lastProcessedChunk = (await redis.get<number>('csv_chunk_index')) ?? 0;

    // If all chunks are already processed, stop
    if (lastProcessedChunk >= totalChunks) {
      return NextResponse.json<APIResponse>({
        status: "success",
        message: "All chunks already processed",
      });
    }

    // Process one chunk at a time (you can increase if needed)
    const chunkStart = lastProcessedChunk * chunkSize;
    const chunk = records.slice(chunkStart, chunkStart + chunkSize);
    console.log(`Processing chunk ${lastProcessedChunk + 1}/${totalChunks}`, chunk);
    await processChunk(chunk);

    // Save progress to Redis
    await redis.set('csv_chunk_index', lastProcessedChunk + 1);

    return NextResponse.json<APIResponse>({
      status: "success",
      data: {
        processedChunk: lastProcessedChunk + 1,
        totalChunks,
      },
    });

  } catch (error) {
    console.error('CSV processing failed:', error);
    return NextResponse.json<APIResponse>({
      status: "failure",
      error: 'Processing failed'
    });
  }
}

