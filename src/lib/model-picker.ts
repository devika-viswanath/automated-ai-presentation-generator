import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { type LanguageModelV1 } from "ai";

/**
 * Centralized model picker function for all presentation generation routes
 * Uses Gemini as the single text model
 */
export function modelPicker(
  _modelProvider: string,
  _modelId?: string,
): LanguageModelV1 {
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });
  return google("gemini-2.0-flash") as unknown as LanguageModelV1;
}
