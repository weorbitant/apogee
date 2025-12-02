import OpenAI from "openai";
import type { ChatCompletionCreateParams } from "openai/resources/chat/completions";
import type { ChatCompletion } from "openai/resources/chat/completions";

export type { ChatCompletionCreateParams, ChatCompletion };

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function createChatCompletion(
  params: ChatCompletionCreateParams
): Promise<ChatCompletion> {
  const completion = await client.chat.completions.create({
    ...params,
    stream: false
  });
  return completion;
}
