import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function analyzeLogs(siteName: string, logs: any[]) {
  const prompt = `Analyze the following server logs for "${siteName}" and provide a brief report with an analysis of any issues and specific suggestions for improvement.
  
Logs:
${JSON.stringify(logs, null, 2)}

Format the response as a JSON object with "analysis" (string) and "suggestions" (array of strings) fields.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

export {
  batchProcess,
  batchProcessWithSSE,
  isRateLimitError,
  type BatchOptions,
} from "./utils";

