import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';

const openAiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { partNumber, note } = await req.json();

    if (!partNumber) {
      return NextResponse.json(
        { error: "partNumber is required" },
        { status: 400 }
      );
    }

    const noteText = note ? `\nNOTE: ${note}\n` : "";

    const prompt = `
    ${noteText}
Given the vehicle part number "${partNumber}", return a list of compatible vehicles in this exact JSON format:

[
  {
    "make": "Make",
    "model": "Model",
    "years": "Year range like 2000–2006",
    "engineOptions": ["List", "of", "common", "engines"],
    "drive": "RWD/FWD/AWD",
    "note": "Add note or comment Regarding parts fits in vehicle",
    "lugCount": 6
  }
]

Only return valid JSON. Do not include markdown, explanations, or any text outside of the JSON. If compatibility is uncertain, set "years" to "unknown".
`;

    const response = await openAiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = response.choices[0].message.content?.trim() || '';

    // GPT might return markdown like ```json ... ``` - extract the JSON inside
    const jsonMatch = raw.match(/```json([\s\S]*?)```/i);
    const cleanJson = jsonMatch ? jsonMatch[1].trim() : raw;

    let data;
    try {
      data = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse JSON:", e, "Raw response:", raw);
      return NextResponse.json(
        {
          error:
            "Failed to parse GPT response as JSON. See logs for details.",
          rawResponse: raw,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      partNumber,
      compatibleVehicles: data,
    });
  } catch (e: any) {
    console.error("API error:", e);
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


export async function GET(req: NextRequest) {
  try {

    const { searchParams } = new URL(req.url);
    const partNumber = searchParams.get('partNumber');
    const note = searchParams.get('partNumber');

    if (!partNumber) {
      return NextResponse.json(
        { error: "partNumber is required" },
        { status: 400 }
      );
    }

    const systemMessage = `
    You are a precise automotive parts compatibility assistant. You provide compatibility information based on well-established sources and best-known industry data. 

    Your answers must:
    - Prefer accuracy and well-known information; if you are uncertain, say "years": "unknown".
    - Avoid wild guesses; return "unknown" rather than inventing details.
    - Return only valid JSON in the exact format specified.
    - Never include markdown, explanations, or text outside the JSON.
    
    `;

    const userMessage = `
    Given the vehicle part number "${partNumber}", return a list of compatible vehicles in this exact JSON format:

    [
      {
        "make": "Make",
        "model": "Model",
        "years": "Year range like 2000–2006",
        "engineOptions": ["List", "of", "common", "engines"],
        "drive": "RWD/FWD/AWD"
        "note": "Add note or comment Regarding parts fits in vehicle"
      }
    ]
    
    If compatibility is uncertain, set "years" or "engineOptions" to "unknown".
    
    Only return valid JSON. Do not include markdown, explanations, or any text outside of the JSON.
    ${note ? `\nNOTE: ${note}` : ""}
    `;

    const response = await openAiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2  // Even more deterministic
    });
    console.log(JSON.stringify(response), "response")
    const raw = response.choices[0].message.content?.trim() || '';

    // GPT might return ```json ... ``` - extract just the JSON
    const jsonMatch = raw.match(/```json([\s\S]*?)```/i);
    const cleanJson = jsonMatch ? jsonMatch[1].trim() : raw;

    let data;
    try {
      data = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse JSON:", e, "Raw response:", raw);
      return NextResponse.json(
        {
          error: "Failed to parse GPT response as JSON. See logs for details.",
          rawResponse: raw,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      partNumber,
      compatibleVehicles: data,
    });
  } catch (e: any) {
    console.error("API error:", e);
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


