import OpenAI from "openai";

const kimi = new OpenAI({
  apiKey: process.env.KIMI_API_KEY!,
  baseURL: "https://api.moonshot.ai/v1",
});

export default kimi;