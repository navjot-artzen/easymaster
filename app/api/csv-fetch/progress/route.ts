import { NextResponse } from "next/server";
import { parse } from 'csv-parse/sync';
import redis from "@/lib/upstash/redis";
import { getCsvData } from "@/utils/csv";
import prisma from "@/lib/prisma";
import { chunkSize } from "@/utils/config/constant";

export async function GET() {
  try {
    const csvData = await getCsvData();
    if (!csvData) {
      return NextResponse.json({ status: 'failure', message: 'No active CSV file' });
    }

    const records = parse(csvData, { columns: true, skip_empty_lines: true });
    const totalChunks = Math.ceil(records.length / chunkSize);
    const activeFile = await prisma.csvFile.findFirst({
      where: { active: true, isProcessed: false },
      orderBy: { createdAt: "asc" },
    });
    if (!activeFile) {
      return NextResponse.json({
        status: 'success',
        message: "No active file found",
        data: null
      });
    }
    const redisKey = `csv_chunk_index_${activeFile.id}`;
    const processedChunks = (await redis.get<number>(redisKey)) ?? 0;

    return NextResponse.json({
      status: 'success',
      data: {
        totalRecords: records.length,
        chunkSize,
        totalChunks,
        processedChunks,
        remainingChunks: Math.max(totalChunks - processedChunks, 0),
        progressPercent: Math.min(Math.round((processedChunks / totalChunks) * 100), 100)
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'failure',
      error: 'Unable to fetch progress',
    });
  }
}