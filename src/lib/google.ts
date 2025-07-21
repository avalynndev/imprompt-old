import { createGoogleGenerativeAI } from "@ai-sdk/google";
import "dotenv/config"

const geminiKey = process.env.GEMINI_API_KEY;
export const google = createGoogleGenerativeAI({
  apiKey: geminiKey,
});
