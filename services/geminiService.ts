import { GoogleGenAI, Type } from "@google/genai";
import { EtymologyData } from "../types";

// In development, call Gemini directly. In production, use serverless proxy.
const isDev = import.meta.env.DEV;

let _ai: GoogleGenAI | null = null;
const getAI = () => {
  if (!_ai) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
};

export const fetchEtymology = async (name: string): Promise<EtymologyData> => {
  if (!isDev) {
    // Production: use serverless proxy
    const res = await fetch('/.netlify/functions/gemini-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'etymology', name })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `API error: ${res.status}`);
    }
    return res.json();
  }

  // Dev: call Gemini directly
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

  try {
    return JSON.parse(text) as EtymologyData;
  } catch (e) {
    console.error("Failed to parse Gemini response:", e);
    throw new Error("Failed to process etymology data.");
  }
};

export const fetchChatResponse = async (history: { role: string, parts: { text: string }[] }[], newMessage: string): Promise<string> => {
  if (!isDev) {
    // Production: use serverless proxy
    const res = await fetch('/.netlify/functions/gemini-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'chat', history, message: newMessage })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `API error: ${res.status}`);
    }
    const data = await res.json();
    return data.text;
  }

  // Dev: call Gemini directly
  const modelId = "gemini-3-flash-preview";

  const chat = getAI().chats.create({
    model: modelId,
    history: history,
    config: {
      systemInstruction: "You are an expert etymologist and cultural historian assistant. Your goal is to help users find names based on specific criteria (e.g., meaning, culture, origin). \n\nIMPORTANT FORMATTING RULES:\n1. When you suggest specific names, you MUST enclose the name in square brackets like this: [Name].\n2. When listing multiple names or facts, ALWAYS use a bulleted list (* ) or numbered list (1. ). Do not group them in a single paragraph.\n3. Use **bold** for key terms, definitions, or names to improve readability.\n4. Keep descriptions concise but informative.",
    },
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text || "I'm sorry, I couldn't generate a response.";
};