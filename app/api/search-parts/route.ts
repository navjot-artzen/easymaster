// import { NextRequest, NextResponse } from 'next/server';
// import OpenAI from 'openai';
// import axios from 'axios';
// import * as cheerio from 'cheerio';

// export const runtime = 'edge';

// const openAiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
// const serperApiKey = process.env.SERP_API_KEY!;

// // Custom tool definition for the OpenAI model
// const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
//     {
//         type: 'function',
//         function: {
//             name: 'perform_web_search_and_scrape',
//             description: 'Performs a web search and scrapes the content of the top results to find vehicle compatibility for a given automotive part number. The system uses the part number and user note to perform the search.',
//             parameters: {
//                 type: 'object',
//                 properties: {
//                     // The model doesn't need to provide arguments, but the schema requires at least one.
//                     // We'll ignore this argument in our code.
//                     confirm: {
//                         type: 'boolean',
//                         description: 'Confirm triggering the search.',
//                     },
//                 },
//                 required: ['confirm'],
//             },
//         },
//     },
// ];

// async function perform_web_search_and_scrape(partNumber: string, note?: string) {
//     try {
//         const generalQuery = `"${partNumber}" (fitment OR compatibility OR applications OR interchange)`;
//         console.log(`Performing general Serper search for: ${generalQuery}`);
//         const generalSearchPromise = axios.post('https://google.serper.dev/search', {
//             q: generalQuery,
//         }, {
//             headers: { 'X-API-KEY': serperApiKey, 'Content-Type': 'application/json' },
//         });

//         const searchPromises = [generalSearchPromise];

//         if (note) {
//             const specificQuery = `"${partNumber}" "${note}" (fitment OR compatibility)`;
//             console.log(`Performing specific Serper search for: ${specificQuery}`);
//             const specificSearchPromise = axios.post('https://google.serper.dev/search', { q: specificQuery }, {
//                 headers: { 'X-API-KEY': serperApiKey, 'Content-Type': 'application/json' },
//             });
//             searchPromises.push(specificSearchPromise);
//         }

//         const searchResponses = await Promise.all(searchPromises);
//         console.log("Serper API responses received.");
        
//         const allLinks: string[] = searchResponses.flatMap(response => 
//             (response.data.organic || []).map((r: any) => r.link)
//         );

//         const uniqueLinks = [...new Set(allLinks)].slice(0, 5); // Scrape top 5 unique links


//         if (uniqueLinks.length === 0) {
//             return "No search results found.";
//         }

//         const scrapePromises = uniqueLinks.map(async (link: string) => {
//             try {
//                 console.log(`Scraping URL: ${link}`);
//                 const { data: html } = await axios.get(link, {
//                     timeout: 5000, // 5 second timeout
//                     headers: { // Use a common user-agent to avoid being blocked
//                         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
//                     }
//                 });
//                 const $ = cheerio.load(html);
//                 $('script, style, nav, footer, header').remove(); // Remove noisy elements
//                 const pageText = $('body').text().replace(/\s\s+/g, ' ').trim();
//                 return `--- START OF PAGE: ${link} ---\n${pageText}\n--- END OF PAGE: ${link} ---\n\n`;
//             } catch (error: any) {
//                 console.error(`Failed to scrape ${link}:`, error.message);
//                 return ''; // Return empty string on failure, we'll just skip this page
//             }
//         });

//         const scrapedContents = (await Promise.all(scrapePromises)).join('');
        
//         return scrapedContents || "Could not scrape any content from the search results.";

//     } catch (error: any) {
//         console.error("Serper API Error:", error.response ? error.response.data : error.message);
//         return JSON.stringify({ error: "Failed to perform web search." });
//     }
// }


// export async function POST(req: NextRequest) {
//     try {
//         const { partNumber, note } = await req.json();
//         console.log("Note:", note);
//         if (!partNumber) {
//             return NextResponse.json({ error: "partNumber is required" }, { status: 400 });
//         }

//         const systemMessage = `
//         You are a precise automotive parts compatibility assistant. Your ONLY job is to determine what vehicle(s) a part fits, based on the raw text content from webpages provided to you.

//         1.  The system will perform a web search and scrape the content from several pages. You will receive this content as a single block of text.
//         2.  You MUST analyze the provided text content from all pages. Your task is to extract compatibility information from this text.
//         3.  **Pay special attention to the user's note in the prompt, as it contains important hints that should be prioritized.**
//         4.  From the text, extract and aggregate the following details:
//             - The make and model.
//             - An aggregated year range (e.g., "2011–2016").
//             - A list of specific engine options (e.g., ["2.0L", "2.4L"]).
//             - The drive type. It must be one of: "FWD", "RWD", "AWD", or "unknown".
//         5.  Generate a single JSON array of compatible vehicles in the **exact format specified below**.
//         6.  If you cannot find a specific detail from the provided text, use "unknown".
//         7.  If the provided text is inconclusive or doesn't contain fitment data, return an empty array [].
//         8.  Your final response to the user must be ONLY the JSON array. Do not include any other text, markdown, or explanations.

//         **JSON Output Format:**
//         [
//           {
//             "make": "Make",
//             "model": "Model",
//             "years": "A year range like '2011–2016'",
//             "engineOptions": ["List", "of", "common", "engines", "like", "3.5L V6"],
//             "drive": "FWD",
//             "note": "Add a comment about the source of the information or why this vehicle may fit"
//           }
//         ]
//         `;

//         const userMessage = `Find compatible vehicles for part number: "${partNumber}". ${note ? `Note: ${note}` : ''}`;
        
//         const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
//             { role: "system", content: systemMessage },
//             { role: "user", content: userMessage },
//         ];

//         // First call: Force the model to use our web search and scrape tool
//         const initialResponse = await openAiClient.chat.completions.create({
//             model: "gpt-4o",
//             messages: messages,
//             tools: tools,
//             tool_choice: { type: "function", function: { name: "perform_web_search_and_scrape" } },
//         });

//         const responseMessage = initialResponse.choices[0].message;
//         const toolCalls = responseMessage.tool_calls;

//         if (!toolCalls) {
//             console.error("Model failed to call the required tool.");
//             return NextResponse.json({ error: "Model did not use the required search tool." }, { status: 500 });
//         }
        
//         console.log("Model is using the required scrape tool. Processing...");
//         messages.push(responseMessage);

//         for (const toolCall of toolCalls) {
//             const functionName = toolCall.function.name;
//             if (functionName === 'perform_web_search_and_scrape') {
//                 // Ignore model-generated arguments and use our dual-search function
//                 const searchResults = await perform_web_search_and_scrape(partNumber, note);
//                 // console.log("Search results:", searchResults);
//                 messages.push({
//                     tool_call_id: toolCall.id,
//                     role: 'tool',
//                     content: searchResults,
//                 });
//             }
//         }

//         // Second call: Provide scraped content to the model to get the final answer
//         console.log("Sending scraped page content back to the model...");
//         const finalResponse = await openAiClient.chat.completions.create({
//             model: "gpt-4o",
//             messages: messages,
//         });
//         // console.log("Search finalResponse:", finalResponse);
//         const finalMessage = finalResponse.choices[0].message.content?.trim() || '';
//         // console.log("Model's raw final message:", finalMessage);
//         const raw = finalMessage;
        
//         const jsonMatch = raw.match(/```json([\s\S]*?)```/i);
//         const cleanJson = jsonMatch ? jsonMatch[1].trim() : raw;

//         if (!cleanJson) {
//             console.log("Model returned an empty response. Returning empty array.");
//             return NextResponse.json({
//                 partNumber,
//                 compatibleVehicles: [],
//             });
//         }

//         console.log("Attempting to parse cleaned JSON:", cleanJson);

//         let data;
//         try {
//             data = JSON.parse(cleanJson);
//         } catch (e) {
//             console.error("Failed to parse final JSON response:", e, "Raw response:", raw);
//             return NextResponse.json({ error: "Failed to parse GPT response as JSON.", rawResponse: raw }, { status: 500 });
//         }

//         // Step 2: If we got data, make a second call to enrich it with engine/drive types.
//         if (data && data.length > 0) {
//             console.log("Enriching vehicle data with a second AI call...");

//             const enrichmentSystemMessage = `
//             You are an automotive data specialist. Your task is to enrich a given JSON array of vehicles with 'engineOptions' and 'drive' types.
//             - Use your knowledge of vehicles to fill in the missing data based on the provided make, model, and years.
//             - **A user may have provided a hint in the prompt. Prioritize information that aligns with this hint.**
//             - The drive type MUST be one of: "FWD", "RWD", "AWD", or "unknown".
//             - The engineOptions should be a list of common engine sizes, like ["2.0L", "3.5L V6"].
//             - It is crucial that you return the complete, updated JSON array. Do not add any text, explanations, or markdown outside of the JSON. Your entire response must be the JSON array itself.
//             `;
//             const enrichmentUserMessage = `Please enrich the following JSON data with specific 'engineOptions' and 'drive' types for each vehicle. Return the full, updated JSON array.\n\n${JSON.stringify(data)}\n\n${note ? `USER HINT: "${note}"` : ''}`;

//             try {
//                 const enrichmentResponse = await openAiClient.chat.completions.create({
//                     model: "gpt-4o",
//                     messages: [
//                         { role: "system", content: enrichmentSystemMessage },
//                         { role: "user", content: enrichmentUserMessage },
//                     ],
//                 });

//                 const enrichedRaw = enrichmentResponse.choices[0].message.content?.trim() || '';
//                 console.log("Model's raw enrichment message:", enrichedRaw);
//                 const enrichedData = JSON.parse(enrichedRaw);
//                 data = enrichedData; // Replace original data with enriched data

//             } catch (enrichmentError) {
//                 console.error("Failed to enrich vehicle data. The original data will be returned.", enrichmentError);
//                 // If enrichment fails, we proceed with the original data. No need to fail the whole request.
//             }
//         }

//         return NextResponse.json({
//             partNumber,
//             compatibleVehicles: data,
//         });

//     } catch (e: any) {
//         console.error("API error:", e.response ? e.response.data : e.message);
//         return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
//     }
// }


import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';

export const runtime = 'edge';

const openAiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const serperApiKey = process.env.SERP_API_KEY!;

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'perform_web_search_and_scrape',
      description: 'Performs a web search and scrapes the content of the top results to find vehicle compatibility for a given automotive part number.',
      parameters: {
        type: 'object',
        properties: {
          confirm: {
            type: 'boolean',
            description: 'Confirm triggering the search.',
          },
        },
        required: ['confirm'],
      },
    },
  },
];

async function perform_web_search_and_scrape(partNumber: string, note?: string) {
  try {
    const generalQuery = `"${partNumber}" (fitment OR compatibility OR applications OR interchange)`;
    console.log(`Performing general Serper search for: ${generalQuery}`);
    const generalSearchPromise = fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: generalQuery }),
    }).then(async res => {
      if (!res.ok) throw new Error(`Serper general search failed with status ${res.status}`);
      return res.json();
    });

    const searchPromises = [generalSearchPromise];

    if (note) {
      const specificQuery = `"${partNumber}" "${note}" (fitment OR compatibility)`;
      console.log(`Performing specific Serper search for: ${specificQuery}`);
      const specificSearchPromise = fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: specificQuery }),
      }).then(async res => {
        if (!res.ok) throw new Error(`Serper specific search failed with status ${res.status}`);
        return res.json();
      });
      searchPromises.push(specificSearchPromise);
    }

    const searchResponses = await Promise.all(searchPromises);
    console.log("Serper API responses received.");

    const allLinks: string[] = searchResponses.flatMap(response =>
      (response.organic || []).map((r: any) => r.link)
    );

    const uniqueLinks = [...new Set(allLinks)].slice(0, 5);

    if (uniqueLinks.length === 0) {
      return "No search results found.";
    }

    const scrapePromises = uniqueLinks.map(async (link: string) => {
      try {
        console.log(`Scraping URL: ${link}`);
        const timeout = 5000;
        const response :any = await Promise.race([
          fetch(link, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
          ),
        ]);
        if (!response?.ok) throw new Error(`Failed to fetch ${link}: ${response.status}`);
        const html = await response.text();
        const $ = cheerio.load(html);
        $('script, style, nav, footer, header').remove();
        const pageText = $('body').text().replace(/\s\s+/g, ' ').trim();
        return `--- START OF PAGE: ${link} ---\n${pageText}\n--- END OF PAGE: ${link} ---\n\n`;
      } catch (error: any) {
        console.error(`Failed to scrape ${link}:`, error.message);
        return '';
      }
    });

    const scrapedContents = (await Promise.all(scrapePromises)).join('');

    return scrapedContents || "Could not scrape any content from the search results.";
  } catch (error: any) {
    console.error("Serper API Error:", error.message);
    return JSON.stringify({ error: "Failed to perform web search." });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { partNumber, note } = await req.json();
    console.log("Note:", note);
    if (!partNumber) {
      return NextResponse.json({ error: "partNumber is required" }, { status: 400 });
    }
const systemMessage = `
You are a precise automotive parts compatibility assistant. Your ONLY job is to determine what vehicle(s) a part fits, based on the raw text content from webpages provided to you.

1. The system will perform a web search and scrape the content from several pages. You will receive this content as a single block of text.
2. You MUST analyze the provided text content from all pages. Your task is to extract compatibility information from this text.
3. Pay special attention to the user's note in the prompt, as it contains important hints that should be prioritized.
4. From the text, extract and aggregate the following details:
   - The make and model.
   - An aggregated year range (e.g., "2011–2016").
   - A list of specific engine options (e.g., ["2.0L", "2.4L"]).
   - The drive type. It must be one of: "FWD", "RWD", "AWD", or "unknown".
   - Only include a "note" field IF there is specific, unique fitment information for that vehicle.
     - For example: "Fits only 2.5L, not 3.5L", "Uses smaller variant of this part number", etc.
     - Do NOT include the "note" key at all if there's no such specific info.
     - Do NOT use generic notes like "Fits this vehicle".
     - Do NOT repeat the same note for multiple vehicles.
5. Generate a single JSON array of compatible vehicles in the exact format specified below.
6. If you cannot find a specific detail from the provided text, use "unknown".
7. If the provided text is inconclusive or doesn't contain fitment data, return an empty array [].
8. Your final response to the user must be ONLY the JSON array. Do not include any other text, markdown, or explanations.

**JSON Output Format:**
[
  {
    "make": "Make",
    "model": "Model",
    "years": "A year range like '2011–2016'",
    "engineOptions": ["List", "of", "common", "engines"],
    "drive": "FWD"
    // "note": "Only include if something unique applies"
  }
]
`;



    const userMessage = `Find compatible vehicles for part number: "${partNumber}". ${note ? `Note: ${note}` : ''}`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemMessage },
      { role: "user", content: userMessage },
    ];

    const initialResponse = await openAiClient.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      tools: tools,
      tool_choice: { type: "function", function: { name: "perform_web_search_and_scrape" } },
    });

    const responseMessage = initialResponse.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    if (!toolCalls) {
      console.error("Model failed to call the required tool.");
      return NextResponse.json({ error: "Model did not use the required search tool." }, { status: 500 });
    }

    console.log("Model is using the required scrape tool. Processing...");
    messages.push(responseMessage);

    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      if (functionName === 'perform_web_search_and_scrape') {
        const searchResults = await perform_web_search_and_scrape(partNumber, note);
        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: searchResults,
        });
      }
    }

    console.log("Sending scraped page content back to the model...");
    const finalResponse = await openAiClient.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
    });
    const finalMessage = finalResponse.choices[0].message.content?.trim() || '';
    const raw = finalMessage;

    const jsonMatch = raw.match(/```json([\s\S]*?)```/i);
    const cleanJson = jsonMatch ? jsonMatch[1].trim() : raw;

    if (!cleanJson) {
      console.log("Model returned an empty response. Returning empty array.");
      return NextResponse.json({
        partNumber,
        compatibleVehicles: [],
      });
    }

    console.log("Attempting to parse cleaned JSON:", cleanJson);

    let data;
    try {
      data = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse final JSON response:", e, "Raw response:", raw);
      return NextResponse.json({ error: "Failed to parse GPT response as JSON.", rawResponse: raw }, { status: 500 });
    }

    if (data && data.length > 0) {
      console.log("Enriching vehicle data with a second AI call...");

      const enrichmentSystemMessage = `
You are an automotive data specialist. Your task is to enrich a given JSON array of vehicles with 'engineOptions' and 'drive' types.

- Use your knowledge of vehicles to fill in the missing data based on the provided make, model, and years.
- ONLY include a 'note' if a specific vehicle has a unique condition, such as:
   - The part only fits a specific engine type.
   - The part is incompatible with a trim or transmission.
   - The part fits a subset of the vehicle years or versions.
- NEVER add generic notes like "This part fits this vehicle" or copy the same note for multiple vehicles.
- The drive type MUST be one of: "FWD", "RWD", "AWD", or "unknown".
- The engineOptions should be a list of common engine sizes, like ["2.0L", "3.5L V6"].
- Return the complete, updated JSON array only. Do not add any text, explanations, or markdown.
`;


      const enrichmentUserMessage = `Please enrich the following JSON data with specific 'engineOptions' and 'drive' types for each vehicle. Return the full, updated JSON array.\n\n${JSON.stringify(data)}\n\n${note ? `USER HINT: "${note}"` : ''}`;

      try {
        const enrichmentResponse = await openAiClient.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: enrichmentSystemMessage },
            { role: "user", content: enrichmentUserMessage },
          ],
        });

        const enrichedRaw = enrichmentResponse.choices[0].message.content?.trim() || '';
        console.log("Model's raw enrichment message:", enrichedRaw);
        const enrichedData = JSON.parse(enrichedRaw);
        data = enrichedData;

      } catch (enrichmentError) {
        console.error("Failed to enrich vehicle data. Returning original data.", enrichmentError);
      }
    }

    return NextResponse.json({
      partNumber,
      compatibleVehicles: data,
    });

  } catch (e: any) {
    console.error("API error:", e.message);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
