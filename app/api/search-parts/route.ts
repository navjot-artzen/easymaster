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
