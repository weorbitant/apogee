import { describe, it, expect, vi, beforeEach } from 'vitest'
import { aiWeeklySummary } from '@/app/_lib/_process/aiWeeklySummary'
import type { ChatCompletion } from 'openai/resources/chat/completions'
import * as openaiClient from '@/app/_lib/_openai/client'
import * as slackClient from '@/app/_lib/_slack'
import { prisma } from '@/app/_lib/_db/index'

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
  sendPromptMessage: vi.fn(),
}))

describe('aiWeeklySummary', () => {
  const mockCreateChatCompletion = vi.mocked(openaiClient.createChatCompletion)
  const mockSendPromptMessage = vi.mocked(slackClient.sendPromptMessage)

  beforeEach(async () => {
    vi.clearAllMocks()

    await prisma.transaction.deleteMany({})
    await prisma.user.deleteMany({})
    // Default mock responses for OpenAI calls
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
    await aiWeeklySummary('C123', 'prompt')

    const expectedToolResults = {
      getLastWeekLeaderboard: [],
      getLastWeekTransactions: [],
      getTodayLeaderboard: [],
    }
    // Second call: message composition
    expect(mockCreateChatCompletion).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        model: 'gpt-4.1-mini',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: 'Compose a human-readable message using the provided tool data, suitable for posting in Slack.',
          }),
          expect.objectContaining({
            role: 'user',
            content: 'prompt',
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
    await aiWeeklySummary('C123', 'prompt')
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
      1,
      expect.objectContaining({
        model: 'gpt-4.1-mini',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: 'Compose a human-readable message using the provided tool data, suitable for posting in Slack.',
          }),
          expect.objectContaining({
            role: 'user',
            content: 'prompt',
          }),
          expect.objectContaining({
            role: 'system',
            content: 'Here are the results from the tools: ' + JSON.stringify(expectedToolResults, null, 2),
          }),
        ]),
      })
    )
  })

  it('should call sendPromptMessage with the composed message', async () => {
    await aiWeeklySummary('C123', 'prompt')
    
    expect(mockSendPromptMessage).toHaveBeenCalledWith(
      'C123',
      'Mocked response message'
    )
  })
})