// services/gemini.service.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.1,
    responseMimeType: "application/json",
  },
});

export default geminiModel;