import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI();

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
    try {
        const { searchParams } = new URL(req.url);
        const vin = searchParams.get('vin');

        if (!vin) {
            return NextResponse.json({ error: "VIN is required" }, { status: 400, headers: corsHeaders });
        }

        // Fetch VIN data from NHTSA API
        const response = await fetch(
            `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`
        );
        const data = await response.json();

        const results = data.Results.reduce((acc: any, item: any) => {
            if (item.Variable && item.Value) {
                acc[item.Variable] = item.Value;
            }
            return acc;
        }, {});

        // Build prompt for GPT-4o
        const prompt = `
        You are an expert automotive data analyst.
        
        Given the decoded VIN data below, generate a JSON object with these keys:
        
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
        
        Decoded VIN data:
        ${JSON.stringify(results, null, 2)}
        
        Return ONLY the JSON object — do not include any explanation or extra text.
        `;


        const gptResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a professional vehicle analyst."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        const summaryRaw = gptResponse.choices[0].message.content?.trim() || '';

        const jsonMatch = summaryRaw.match(/```json([\s\S]*?)```/i);
        const cleanJson = jsonMatch ? jsonMatch[1].trim() : summaryRaw;

        let summary;
        try {
            summary = JSON.parse(cleanJson);
        } catch (e) {
            console.error("Failed to parse JSON:", e, "Raw response:", summaryRaw);
            return NextResponse.json(
                {
                    error:
                        "Failed to parse GPT response as JSON. See logs for details.",
                    rawResponse: summaryRaw,
                },
                { status: 500, headers: corsHeaders },
            );
        }

        return NextResponse.json({
            vin,
            gptSummary: summary,
            decodedData: results,

        }, { headers: corsHeaders })
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to decode VIN or call OpenAI." },
            { status: 500, headers: corsHeaders }
        );
    }
}
