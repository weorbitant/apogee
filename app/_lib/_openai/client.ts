import OpenAI from "openai";
import type { ChatCompletionCreateParams } from "openai/resources/chat/completions";
import type { ChatCompletion } from "openai/resources/chat/completions";

export type { ChatCompletionCreateParams, ChatCompletion };

export interface OpenAIClientInterface {
  createChatCompletion(params: ChatCompletionCreateParams): Promise<ChatCompletion>;
}

export class OpenAIClient implements OpenAIClientInterface {
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
  }

  async createChatCompletion(params: ChatCompletionCreateParams): Promise<ChatCompletion> {
    const completion = await this.client.chat.completions.create({
      ...params,
      stream: false
    });
    return completion;
  }
}

// Export a singleton instance for use in the app
export const openAIClient = new OpenAIClient();

