import { NextResponse } from "next/server";
import { parse } from 'csv-parse/sync';
import redis from "@/lib/upstash/redis";
import { getCsvData } from "@/utils/csv";

export async function GET() {
  try {
    const csvData = await getCsvData();
    if (!csvData) {
      return NextResponse.json({ status: 'failure', message: 'No active CSV file' });
    }

    const records = parse(csvData, { columns: true, skip_empty_lines: true });
    const chunkSize = 10;
    const totalChunks = Math.ceil(records.length / chunkSize);
    const redisKey = `csv_chunk_index`
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