import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/prisma';

import { parse } from 'csv-parse/sync';
import redis from '@/lib/upstash/redis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  console.log("inside api")
  const formData = await req.formData();
  
  const file = formData.get('file') as File;
  const shop = formData.get('shop') as string | null;
  const text = await file.text();
  const records = parse(text, { columns: true, skip_empty_lines: true });
  const totalRecords = records.length;

  if (!file || file.type !== 'text/csv') {
    return NextResponse.json({ message: 'Only CSV files are allowed.' }, { status: 400 });
  }

  if (!shop) {
    return NextResponse.json({ message: 'Missing shop information.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `csv/${Date.now()}-${file.name}`;
  const bucketName = process.env.SUPABASE_STORAGE;

  if (!bucketName) {
    return NextResponse.json({ message: 'Missing SUPABASE_STORAGE env variable.' }, { status: 500 });
  }

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, buffer, {
      contentType: 'text/csv',
    });

  if (uploadError) {
    return NextResponse.json({ message: 'Upload to Supabase failed.', error: uploadError.message }, { status: 500 });
  }

  const { data: publicData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  const publicUrl = publicData?.publicUrl;

     const activeFile = await prisma.csvFile.findFirst({
      where: { active: true, isProcessed: false },
    });

    const isFirstFile = !activeFile;


   const createdFile = await prisma.csvFile.create({
    data: {
      name: file.name,
      url: publicUrl || '',
      shop: shop,
      active: isFirstFile,
      totalRecords: totalRecords,
    },
  });

  return NextResponse.json({
    message: 'Upload successful',
     createdFile

  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({ message: 'Missing shop parameter.' }, { status: 400 });
  }

  const files = await prisma.csvFile.findMany({
    where: { shop },
    orderBy: { createdAt: 'asc' },

  });

  if (!files || files.length === 0) {
    return NextResponse.json({ message: 'No files found for this shop.' }, { status: 404 });
  }

  const enrichedFiles = await Promise.all(
    files.map(async (file) => {
      let totalChunks = 0;
      const chunkSize = 10;
      const redisKey = `csv_chunk_index`;
      const processedChunks = (await redis.get<number>(redisKey)) ?? 0;

      try {
        const {totalRecords}=file
        totalChunks = Math.ceil(totalRecords / chunkSize);
      } catch (error) {
        console.error(`Failed to load or parse CSV from ${file.url}:`, error);
      }

      return {
        id: file.id,
        fileName: file.name,
        url: file.url,
        active: file.active,
        isProcessed: file.isProcessed,
        totalRecords:file.totalRecords,
        chunkSize,
        totalChunks,
        processedChunks,
      };
    })
  );

  return NextResponse.json(enrichedFiles);
}
