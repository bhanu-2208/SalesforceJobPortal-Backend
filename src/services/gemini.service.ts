// services/gemini.service.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

console.log("GEMINI KEY:", JSON.stringify(process.env.GEMINI_API_KEY));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// gemini-1.5-flash — fast, free tier, great for structured extraction
export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",   // updated from gemini-1.5-flash
  generationConfig: {
    temperature: 0.2,
    responseMimeType: "application/json",
  },
});
export default geminiModel;