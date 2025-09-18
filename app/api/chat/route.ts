import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { message, context, isPersonalized } = await req.json();

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  let prompt = `You are an AI assistant helping a student prepare for their Stanford University application. The conversation topic is about their short-term and long-term goals, and why they want to attend Stanford.

Be encouraging, thoughtful, and ask follow-up questions that help the student think deeper about their aspirations. Keep responses conversational and around 2-3 sentences.`;

  if (isPersonalized && context) {
    prompt += `\n\nHere's what you know about the student from previous questions:
- Current study/interest: ${context.currentStudy || "Not provided"}
- Experiences/projects: ${context.experiences || "Not provided"}
- Stanford program interest: ${context.stanfordProgram || "Not provided"}
- Community preferences: ${context.community || "Not provided"}
- Impact goals: ${context.impact || "Not provided"}

Use this context to provide personalized advice and make specific connections between their background and Stanford's offerings.`;
  }

  prompt += `\n\nStudent message: ${message}`;

  const result = streamText({
    model: google("gemini-2.0-flash-exp"),
    prompt: prompt,
    // maxTokens: 200,
    maxOutputTokens: 200,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}
