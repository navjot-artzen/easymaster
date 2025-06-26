import { NextRequest, NextResponse } from 'next/server';


function transformRawData(rawData: { Variable: string; Value: string }[]) {
    const result: Record<string, string> = {};

    rawData.forEach((item) => {
        result[item.Variable] = item.Value;
    });

    return result;
}


// 1HGCM82633A004352
// 1N4AL3AP0JC204554

// lib/cors.ts
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};


export async function OPTIONS(req: NextRequest) {
    return NextResponse.json({}, {
        status: 200,
        headers: corsHeaders,
    });
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const vin = searchParams.get('vin');

    if (!vin) {
        return NextResponse.json({ error: 'VIN number is required' }, { status: 400, headers: corsHeaders });
    }

    try {
        const apiRes = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
        const apiData = await apiRes.json();

        const filteredResults = apiData.Results.filter((item: any) => item.Variable && item.Value);

        const formattedData = transformRawData(filteredResults);
        console.log(formattedData, "formatted")

        return NextResponse.json({
            vin,
            formattedData: formattedData,
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('VIN decode error:', error);
        return NextResponse.json({ error: 'Failed to decode VIN' }, { status: 500, headers: corsHeaders });
    }
}
