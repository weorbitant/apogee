import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createChatCompletion } from '@/app/_lib/_openai/client'
import type { ChatCompletion, ChatCompletionCreateParams } from 'openai/resources/chat/completions'

// Mock OpenAI module - use vi.hoisted to ensure mockCreate is available
const { mockCreate } = vi.hoisted(() => {
  return {
    mockCreate: vi.fn(),
  }
})

vi.mock('openai', () => {
  return {
    default: vi.fn(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  }
})

describe('createChatCompletion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call OpenAI client with correct parameters and stream: false', async () => {
    const mockCompletion: ChatCompletion = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      created: 1234567890,
      model: 'gpt-4',
      choices: [],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    }

    mockCreate.mockResolvedValue(mockCompletion)

    const params: ChatCompletionCreateParams = {
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: 'Hello, world!',
        },
      ],
    }

    const result = await createChatCompletion(params)

    expect(mockCreate).toHaveBeenCalledWith({
      ...params,
      stream: false,
    })
    expect(result).toEqual(mockCompletion)
  })
})

