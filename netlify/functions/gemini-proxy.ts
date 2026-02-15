import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const { action, name, history, message } = body;

    if (action === 'etymology') {
      const modelId = "gemini-3-flash-preview";
      const prompt = `
        Analyze the etymology of the name "${name}". 
        Provide a detailed breakdown including its meaning, origin roots (linguistic), gender association, 
        specific geographical locations associated with its origin or popularity (with coordinates), 
        historical context, cultural significance, related names, and a fun fact.
        
        Ensure the coordinates (lat/lng) are accurate for the specific regions or cities mentioned.
        Classify locations as 'origin' (where it started), 'usage' (where it is popular), or 'cultural' (mythology/literature spots).
      `;

      const response = await getAI().models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              meaning: { type: Type.STRING },
              gender: { type: Type.STRING },
              originRoots: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              locations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    lat: { type: Type.NUMBER },
                    lng: { type: Type.NUMBER },
                    significance: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['origin', 'usage', 'cultural'] }
                  },
                  required: ['name', 'lat', 'lng', 'significance', 'type']
                }
              },
              history: { type: Type.STRING },
              culturalSignificance: { type: Type.STRING },
              relatedNames: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              funFact: { type: Type.STRING }
            },
            required: ['name', 'meaning', 'locations', 'history', 'culturalSignificance', 'originRoots']
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No data returned from Gemini.");
      }

      return new Response(text, {
        headers: { 'Content-Type': 'application/json' }
      });

    } else if (action === 'chat') {
      const modelId = "gemini-3-flash-preview";
      const chat = getAI().chats.create({
        model: modelId,
        history: history || [],
        config: {
          systemInstruction: "You are an expert etymologist and cultural historian assistant. Your goal is to help users find names based on specific criteria (e.g., meaning, culture, origin). \n\nIMPORTANT FORMATTING RULES:\n1. When you suggest specific names, you MUST enclose the name in square brackets like this: [Name].\n2. When listing multiple names or facts, ALWAYS use a bulleted list (* ) or numbered list (1. ). Do not group them in a single paragraph.\n3. Use **bold** for key terms, definitions, or names to improve readability.\n4. Keep descriptions concise but informative.",
        },
      });

      const result = await chat.sendMessage({ message });
      const responseText = result.text || "I'm sorry, I couldn't generate a response.";

      return new Response(JSON.stringify({ text: responseText }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error: any) {
    console.error('Gemini proxy error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: "/.netlify/functions/gemini-proxy"
};
