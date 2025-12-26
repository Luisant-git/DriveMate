import { GoogleGenAI, Type } from "@google/genai";
import { BookingType } from "../types";

const API_KEY = process.env.API_KEY || ''; // Ensure this is set in your environment
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Feature: Smart Package Recommendation
export const getRecommendedPackage = async (userQuery: string): Promise<{ recommendedType: BookingType, reason: string } | null> => {
  if (!API_KEY) {
    console.warn("Gemini API Key missing");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User request: "${userQuery}". 
      Available Packages: ${Object.values(BookingType).join(', ')}.
      Recommend the best single package type for this request.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedType: { type: Type.STRING, enum: Object.values(BookingType) },
            reason: { type: Type.STRING }
          },
          required: ["recommendedType", "reason"]
        }
      }
    });

    const text = response.text;
    if (text) {
        return JSON.parse(text);
    }
    return null;

  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

// Feature: Trip Cost Estimation (Mock logic guided by AI reasoning)
export const getTripEstimate = async (details: string) => {
    if (!API_KEY) {
         return "Approx. ₹500 - ₹2000 depending on distance (AI Unavailable)";
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Estimate the cost range for a driver booking in India based on: "${details}". 
            Assume rates: Local ₹100/hr, Outstation ₹2000/day. Return a short string range like "₹800 - ₹1200".`,
        });
        return response.text;
    } catch (e) {
        return "Estimation unavailable";
    }
}
