import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import OpenAI from 'openai';

export const runtime = 'edge';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const serperApiKey = process.env.SERP_API_KEY!;

const requiredFields = [
    "make", "model", "year", "trim", "bodyClass",
    "engine", "driveType", "transmission", "fuelType",
];

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
    const vin = req.nextUrl.searchParams.get("vin");
    return handleVinRequest(vin);
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    return handleVinRequest(body.vin);
}

async function handleVinRequest(vin: string | null) {
    if (!vin || vin.length !== 17) {
        return NextResponse.json({ error: "VIN must be 17 characters long" }, { status: 400 });
    }

    try {
        // 1. NHTSA decode
        const { data } = await axios.get(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
        const nhtsaRaw = data.Results || [];
        // const errorCheck = nhtsaRaw.find((r: any) => r.Variable === "Error Code" && r.Value !== "0");

        const nhtsaDecoded = nhtsaRaw.reduce((acc: any, item: any) => {
            if (item.Variable && item.Value) acc[item.Variable] = item.Value;
            return acc;
        }, {});

        // 2. Serper Search
        const searchResp = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'X-API-KEY': serperApiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: `${vin} VIN specs`,
                gl: 'us',
                hl: 'en',
            }),
        });

        const searchJson = await searchResp.json();
        const snippets = (searchJson?.organic || [])
            .slice(0, 5)
            .map((r: any) => `${r.title}\n${r.snippet}`)
            .join('\n\n');

        // 3. VIN Structure
        const vinStruct = decodeVIN(vin);

        // 4. GPT-4o Combined Analysis
        const prompt = `
You are a professional automotive analyst.

Analyze the following data from multiple sources and return a JSON object with these keys:

- make
- model
- year
- trim
- bodyClass
- engine
- driveType (must be one of: "FWD", "RWD", "AWD", "4WD")
- transmission
- fuelType

For each key:
- Use the decoded data if present.
- If missing or empty, fill it accurately using your knowledge of the vehicle from the provided make, model, year, and trim.

Data sources:

1. NHTSA Decoded:
${JSON.stringify(nhtsaDecoded, null, 2)}

2. VIN Structure:
${JSON.stringify(vinStruct, null, 2)}

3. Web Snippets:
${snippets || "No snippet data"}

Return ONLY the JSON — no explanations.
`;

        const gptRes = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a professional vehicle analyst." },
                { role: "user", content: prompt },
            ],
            temperature: 0.2,
        });

        const gptText = gptRes.choices[0]?.message?.content?.trim() || '';
        const cleanJson = gptText.match(/```json([\s\S]*?)```/i)?.[1].trim() || gptText;

        let parsed: any;
        try {
            parsed = JSON.parse(cleanJson);
        } catch (err) {
            return NextResponse.json({ error: "Failed to parse GPT output", raw: gptText }, { status: 500 });
        }

        // Ensure all fields exist
        for (const key of requiredFields) {
            if (!(key in parsed)) parsed[key] = null;
        }

        // // Force override of trusted fields
        // parsed.make = nhtsaDecoded["Make"] || parsed.make;
        // parsed.model = nhtsaDecoded["Model"] || parsed.model;
        // parsed.year = nhtsaDecoded["Model Year"] || vinStruct.modelYear || parsed.year;


        return NextResponse.json({
            vin,
            vehicle: parsed,
            sources: {
                nhtsa: nhtsaDecoded,
                vinStructure: vinStruct,
                snippets,
            }
        }, { headers: corsHeaders });

    } catch (err: any) {
        console.error("VIN decode failed:", err);
        return NextResponse.json({ error: "VIN decoding failed", details: err.message }, { status: 500 });
    }
}

// VIN structure decoding
function decodeVIN(vin: string) {
    const manufacturers: Record<string, string> = {
        "1HG": "Honda USA", "2HG": "Honda Canada", "JM1": "Mazda Japan", "JN1": "Nissan Japan",
        "MNT": "Nissan Mexico", "WAU": "Audi Germany", "WBA": "BMW Germany", "WDB": "Mercedes-Benz",
        "1G1": "Chevrolet", "1FT": "Ford Truck", "5YJ": "Tesla"
    };

    const yearCodes: Record<string, number> = {
        'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014, 'F': 2015,
        'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019, 'L': 2020, 'M': 2021,
        'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025, 'T': 2026, 'V': 2027,
        'W': 2028, 'X': 2029, 'Y': 2030, '1': 2001, '2': 2002, '3': 2003,
        '4': 2004, '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009,
        '0': 2015
    };

    const map: Record<string, number> = {
        'A': 1980, 'B': 1981, 'C': 1982, 'D': 1983, 'E': 1984, 'F': 1985,
        'G': 1986, 'H': 1987, 'J': 1988, 'K': 1989, 'L': 1990, 'M': 1991,
        'N': 1992, 'P': 1993, 'R': 1994, 'S': 1995, 'T': 1996, 'V': 1997,
        'W': 1998, 'X': 1999, 'Y': 2000
    };

    return {
        vin,
        wmi: vin.substring(0, 3),
        vds: vin.substring(3, 9),
        vis: vin.substring(9),
        manufacturer: manufacturers[vin.substring(0, 3)] || "Unknown",
        modelYear: yearCodes[vin.charAt(9)] || map[vin.charAt(9)] || "Unknown",
        assemblyPlant: vin.charAt(10),
        serialNumber: vin.substring(11),
        isValid: validateVINChecksum(vin)
    };
}

// VIN checksum validation
function validateVINChecksum(vin: string) {
    const translit: Record<string, number> = {
        'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
        'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9, 'S': 2,
        'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
        '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
    };

    const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 17; i++) {
        const c = vin[i];
        const val = translit[c.toUpperCase()] ?? 0;
        sum += val * weights[i];
    }

    const checkDigit = vin[8];
    const expected = sum % 11;
    return (expected === 10 ? checkDigit === 'X' : checkDigit === expected.toString());
}

