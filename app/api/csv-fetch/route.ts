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

    // 3. Parse CSV
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    });

    const chunkSize = 10;
    const totalChunks = Math.ceil(records.length / chunkSize);

    // 4. Get current chunk progress from Redis
    const redisKey = 'csv_chunk_index';
    const lastProcessedChunk = (await redis.get<number>(redisKey)) ?? 0;

    // 5. If all chunks are processed for this file
    if (lastProcessedChunk >= totalChunks) {
      // Mark active file as complete
      await prisma.csvFile.update({
        where: { id: activeFile.id },
        data: {
          active: false,
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

        // Reset Redis index for next file
        await redis.set(redisKey, 1);
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
    await processChunk(chunk);

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
  } catch (error) {
    console.error("CSV processing failed:", error);
    return NextResponse.json({
      status: "failure",
      error: "Processing failed",
    });
  }
}



