import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/prisma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const file = formData.get('file') as File;
  const shop = formData.get('shop') as string | null;

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

  await prisma.csvFile.create({
    data: {
      name: file.name,
      url: publicUrl || '',
      shop: shop,
    },
  });

  return NextResponse.json({
    message: 'Upload successful',
    name: file.name,
    url: publicUrl,
  });
}


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({ message: 'Missing shop parameter.' }, { status: 400 });
  }

  const lastFile = await prisma.csvFile.findFirst({
    where: { shop },
    orderBy: { createdAt: 'desc' },
  });

  if (!lastFile) {
    return NextResponse.json({ message: 'No file found for this shop.' }, { status: 404 });
  }

  return NextResponse.json({
    name: lastFile.name,
    url: lastFile.url,
  });
}