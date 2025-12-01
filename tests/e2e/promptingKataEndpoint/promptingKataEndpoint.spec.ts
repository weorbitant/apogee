import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processKataPrompting } from '@/app/api/kata-prompting/route'
import type { ChatCompletion } from 'openai/resources/chat/completions'
import * as openaiClient from '@/app/_lib/_openai/client'
import * as slackClient from '@/app/_lib/_slack'
import { prisma } from '@/app/_lib/_db/index'
import openAPIToolsResponse from './mocks/openAPIToolsResponse.json'

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

  beforeEach(async () => {
    vi.clearAllMocks()

    await prisma.transaction.deleteMany({})
    await prisma.user.deleteMany({})
    // Default mock responses for OpenAI calls
    // First call: tool selection (returns tool_calls)
    mockCreateChatCompletion.mockResolvedValueOnce(openAPIToolsResponse as ChatCompletion)
    
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

  it('should call createChatCompletion with correct parameters for tool selection with empty tool results', async () => {    
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
    const expectedToolResults = {
      getLastWeekLeaderboard: [],
      getLastWeekTransactions: [],
      getTodayLeaderboard: [],
    }
    // Second call: message composition
    expect(mockCreateChatCompletion).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        model: 'gpt-4.1-mini',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: 'Compose a human-readable message using the provided tool data.',
          }),
          expect.objectContaining({
            role: 'user',
            content: JSON.stringify({ tools: 'tools', prompt: 'prompt' }),
          }),
          expect.objectContaining({
            role: 'system',
            content: 'Here are the results from the tools: ' + JSON.stringify(expectedToolResults, null, 2),
          }),
        ]),
      })
    )
  })

  it('should call createChatCompletion with info from all tools', async () => {
    const user1 = await prisma.user.create({
      data: {
        username: 'user1',
        displayName: 'User 1',
        realName: 'User 1',
        avatarUrl: 'https://example.com/avatar.png',
        timezone: 'UTC',
        isBot: false,
        isActive: true,
        provider: 'slack',
        providerId: 'USER11111',
      },
    })
    const date = new Date()
    const user2 = await prisma.user.create({
      data: {
        username: 'user2',
        displayName: 'User 2',
        realName: 'User 2',
        avatarUrl: 'https://example.com/avatar.png',
        timezone: 'UTC',
        isBot: false,
        isActive: true,
        provider: 'slack',
        providerId: 'USER22222',
      },
    })
    await prisma.transaction.create({
      data: {
        amount: 100,
        fromUserId: user1.id,
        toUserId: user2.id,
        total: 100,
        message: 'Test message',
        timestamp: date,
        fromUser: '<@USER11111>',
        toUser: '<@USER22222>',
      },
    })
    await processKataPrompting({ channel: 'C123', tools: 'getLastWeekLeaderboard,getLastWeekTransactions,getTodayLeaderboard', prompt: 'prompt' })
    const expectedLeaderboard = [
      {
        toRealName: 'User 2',
        totalReceived: 100,
        rank: 1,
      },
    ]
    // current date but in format for example yyyy-mm-ddThh:mm
    const expectedTransactions = [
      {
        message: 'Test message',
        amount: 100,
        timestamp: date,
        newTotal: 100,
        fromName: 'User 1',
        toName: 'User 2',
      },
    ]
    const expectedTodayLeaderboard = [
      {
        toRealName: 'User 2',
        totalReceived: 100,
        rank: 1,
      },
    ]
    const expectedToolResults = {
      getLastWeekLeaderboard: expectedLeaderboard,
      getLastWeekTransactions: expectedTransactions,
      getTodayLeaderboard: expectedTodayLeaderboard,
    }
    // Second call: message composition
    expect(mockCreateChatCompletion).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        model: 'gpt-4.1-mini',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: 'Compose a human-readable message using the provided tool data.',
          }),
          expect.objectContaining({
            role: 'user',
            content: JSON.stringify({ tools: 'getLastWeekLeaderboard,getLastWeekTransactions,getTodayLeaderboard', prompt: 'prompt' }),
          }),
          expect.objectContaining({
            role: 'system',
            content: 'Here are the results from the tools: ' + JSON.stringify(expectedToolResults, null, 2),
          }),
        ]),
      })
    )
  })

  it('should call sendKataPrompting with the composed message', async () => {
    await processKataPrompting({ channel: 'C123', tools: 'tools', prompt: 'prompt' })
    
    expect(mockSendKataPrompting).toHaveBeenCalledWith(
      'C123',
      'Mocked response message'
    )
  })

  it('should throw an error if no tools were selected by the model', async () => {
    vi.clearAllMocks()
    vi.resetAllMocks()
    mockCreateChatCompletion.mockResolvedValueOnce({
      ...openAPIToolsResponse,
      "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [],
        "refusal": null,
        "annotations": []
      },
      "logprobs": null,
      "finish_reason": "tool_calls"
    }
  ],
    } as ChatCompletion)
    await expect(processKataPrompting({ channel: 'C123', tools: 'tools', prompt: 'prompt' })).rejects.toThrow('No tools were selected by the model')
  })
})