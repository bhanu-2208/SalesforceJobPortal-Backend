// services/gemini.service.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

<<<<<<< HEAD
=======

>>>>>>> 17ce2d2a9e0fc518ddcbaa92efc491c74457dcdc
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// gemini-1.5-flash — fast, free tier, great for structured extraction
export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",   // updated from gemini-1.5-flash
  generationConfig: {
    temperature: 0.1,
    responseMimeType: "application/json",
  },
});
export default geminiModel;
