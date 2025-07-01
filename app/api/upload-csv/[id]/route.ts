import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";
import redis from "@/lib/upstash/redis";
import { chunkSize } from "@/utils/config/constant";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

async function deleteFile(filePath: string) {
    const bucket = process.env.SUPABASE_STORAGE || '';

    if (!bucket) {
        console.error('Bucket not found');
        return
    }

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
        console.error('Failed to delete file:', error);
    } else {
        console.log('File deleted successfully');
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const csvFileId = params.id;
        const body = await req.json();
        const { action } = body;
        if (action === "start") {
            const activeFile = await prisma.csvFile.findFirst({
                where: { active: true, isProcessed: false },
                orderBy: { createdAt: "asc" },
            });

            if (activeFile) {
                const redisKey = `csv_chunk_index_${activeFile.id}`;
                const processedChunks = (await redis.get<number>(redisKey)) ?? 0;
                await prisma.csvFile.update({
                    where: { id: activeFile.id },
                    data: {
                        processedRecords: processedChunks * chunkSize,
                        active: false,
                    },
                });
            }

            await prisma.csvFile.update({
                where: { id: csvFileId },
                data: {
                    active: true,
                    isProcessed: false,
                },
            });
        } else {
            const redisKey = `csv_chunk_index_${csvFileId}`;
            const processedChunks = (await redis.get<number>(redisKey)) ?? 0;
            await prisma.csvFile.update({
                where: { id: csvFileId },
                data: {
                    processedRecords: processedChunks * chunkSize,
                    active: false,
                },
            });
        }

        return NextResponse.json({
            status: "success",
            message: "Update Successfully",
        });
    } catch (error) {
        console.error("CSV processing failed:", error);
        return NextResponse.json({
            status: "failure",
            error: "Processing failed",
        });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const csvFileId = params.id;

        const fileRecord = await prisma.csvFile.findUnique({
            where: { id: csvFileId },
        });

        if (!fileRecord) {
            return NextResponse.json({
                status: "failure",
                error: "File not found",
            });
        }

        await deleteFile(fileRecord?.url);

        await prisma.csvFile.delete({
            where: { id: csvFileId },
        });

        return NextResponse.json({
            status: "success",
            message: "Delete Successfully",
        });
    } catch (error) {
        console.error("CSV processing failed:", error);
        return NextResponse.json({
            status: "failure",
            error: "Processing failed",
        });
    }
}
