import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
// import axios from 'axios';

export const runtime = 'edge';

const openAiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// export async function POST(req: NextRequest) {
//   try {
//     const { partNumber } = await req.json();

//     if (!partNumber) {
//       return NextResponse.json({ error: 'partNumber is required' }, { status: 400 });
//     }

//     // 1️⃣ Fetch search results from SerpAPI
//     const search = await axios.get('https://serpapi.com/search', {
//       params: {
//         engine: 'google',
//         q: `part number ${partNumber} compatible vehicles`,
//         api_key: process.env.SERP_API_KEY,
//       },
//     });

//     const searchResults = {
//       answer_box: search.data.answer_box || null,
//       organic_results: search.data.organic_results || [],
//     };

//     // 2️⃣ Build prompt
//     const prompt = `
// You are a vehicle compatibility expert.
// Based on the part number "${partNumber}", extract ONLY compatible vehicles with make, model, and year from the following data.
// Respond in clean JSON array format like:

// [
//   { "make": "Toyota", "model": "Camry", "years": "2018–2021" },
//   { "make": "Honda", "model": "Accord", "years": "2017–2020" }
// ]

// If no relevant data is found, return an empty array: []

// Search Results:
// ${JSON.stringify(searchResults, null, 2)}
// `;

//     // 3️⃣ Get GPT response
//     const gpt = await openAiClient.chat.completions.create({
//       model: 'gpt-4',
//       messages: [
//         {
//           role: 'system',
//           content:
//             'You are a knowledgeable automotive parts specialist. Return only valid JSON containing compatible vehicles.',
//         },
//         {
//           role: 'user',
//           content: prompt,
//         },
//       ],
//       temperature: 0.2,
//       max_tokens: 500,
//     });

//     const rawText = gpt.choices?.[0]?.message?.content || '';

//     // 4️⃣ Attempt to parse JSON from GPT output
//     let vehicles: any[] = [];
//     try {
//       const start = rawText.indexOf('[');
//       const end = rawText.lastIndexOf(']') + 1;
//       const jsonText = rawText.slice(start, end);
//       vehicles = JSON.parse(jsonText);
//     } catch (err) {
//       vehicles = [];
//     }

//     return NextResponse.json({
//       partNumber,
//       compatibleVehicles: vehicles,
//     });
//   } catch (e: any) {
//     console.error('❌ API error:', e);
//     return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
//   }
// }

export async function POST(req: NextRequest) {
  try {
    const { partNumber } = await req.json();
    if (!partNumber) {
      return NextResponse.json({ error: "partNumber is required" }, { status: 400 });
    }

    const prompt = `
    Given the vehicle part number "${partNumber}", return a list of compatible vehicles in the following JSON format:

    [
      {
        "make": "Nissan",
        "model": "X-Trail",
        "years": "2014–2018"
      },
      {
        "make": "Nissan",
        "model": "Qashqai",
        "years": "2013–2019"
      },
      ...
    ]
    
    Only return the JSON. If compatibility is uncertain, mark "years" as "unknown".    
`;

    const response = await openAiClient.chat.completions.create({
      model: "gpt-4o", // or "gpt-3.5-turbo"
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.choices[0].message.content?.trim() || "";

    // Try to extract valid JSON (GPT sometimes adds ```json)
    const jsonMatch = raw.match(/```json([\s\S]*?)```/);
    const cleanJson = jsonMatch ? jsonMatch[1].trim() : raw;

    const data = JSON.parse(cleanJson);

    return NextResponse.json({
      partNumber,
      compatibleVehicles: data,
    });
  } catch (e: any) {
    console.error("GPT compatibility error:", e);
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: 500 }
    );
  }
}

