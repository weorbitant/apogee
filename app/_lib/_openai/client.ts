import OpenAI from "openai";
import type { ChatCompletionCreateParams } from "openai/resources/chat/completions";
import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import type { Stream } from "openai/streaming";

export type { ChatCompletionCreateParams, ChatCompletionChunk, Stream };

export interface OpenAIClientInterface {
  createChatCompletion(params: ChatCompletionCreateParams): Promise<Stream<ChatCompletionChunk>>;
}

export class OpenAIClient implements OpenAIClientInterface {
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
  }

  async createChatCompletion(params: ChatCompletionCreateParams): Promise<Stream<ChatCompletionChunk>> {
    const stream = await this.client.chat.completions.create({
      ...params,
      stream: true
    });
    return stream;
  }
}

// Export a singleton instance for use in the app
export const openAIClient = new OpenAIClient();

