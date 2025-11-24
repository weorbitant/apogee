import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processKataPrompting } from '@/app/api/kata-prompting/route'
import type { ChatCompletion } from 'openai/resources/chat/completions'
import * as openaiClient from '@/app/_lib/_openai/client'
import * as slackClient from '@/app/_lib/_slack'

// Mock waitUntil to execute immediately
vi.mock('@vercel/functions', () => ({
  waitUntil: vi.fn((promise) => promise),
}))

// Mock OpenAI client
vi.mock('@/app/_lib/_openai/client', () => ({
  createChatCompletion: vi.fn(),
}))

// Mock Slack
vi.mock('@/app/_lib/_slack', () => ({
  sendKataPrompting: vi.fn(),
}))

describe('promptingKataEndpoint', () => {
  const mockCreateChatCompletion = vi.mocked(openaiClient.createChatCompletion)
  const mockSendKataPrompting = vi.mocked(slackClient.sendKataPrompting)

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock responses for OpenAI calls
    // First call: tool selection (returns tool_calls)
    mockCreateChatCompletion.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: 'assistant',
            tool_calls: [
              {
                id: 'call_123',
                type: 'function',
                function: {
                  name: 'getLastWeekLeaderboard',
                  arguments: '{}',
                },
              },
            ],
          },
        },
      ],
    } as ChatCompletion)
    
    // Second call: message composition (returns content)
    mockCreateChatCompletion.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'Mocked response message',
          },
        },
      ],
    } as ChatCompletion)
  })

  it('should call createChatCompletion with correct parameters for tool selection', async () => {    
    await processKataPrompting({ channel: 'C123', tools: 'tools', prompt: 'prompt' })
    
    // Verify first call (tool selection)
    expect(mockCreateChatCompletion).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        model: 'gpt-4.1-mini',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: 'You are an assistant that decides which tools to call based on user input.',
          }),
          expect.objectContaining({
            role: 'user',
            content: JSON.stringify({ tools: 'tools', prompt: 'prompt' }),
          }),
        ]),
        tools: expect.arrayContaining([
          expect.objectContaining({
            type: 'function',
            function: expect.objectContaining({
              name: 'getLastWeekLeaderboard',
            }),
          }),
        ]),
      })
    )
  })

  it('should call createChatCompletion twice (tool selection and message composition)', async () => {    
    await processKataPrompting({ channel: 'C123', tools: 'tools', prompt: 'prompt' })
    
    expect(mockCreateChatCompletion).toHaveBeenCalledTimes(2)
  })

  it('should call sendKataPrompting with the composed message', async () => {
    await processKataPrompting({ channel: 'C123', tools: 'tools', prompt: 'prompt' })
    
    expect(mockSendKataPrompting).toHaveBeenCalledWith(
      'C123',
      'Mocked response message'
    )
  })
})