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
    const expectedTodayLeaderboard = [
      {
        toRealName: 'User 2',
        totalReceived: 100,
        rank: 1,
      },
    ]
    const expectedToolResults = {
      getLastWeekLeaderboard: expectedLeaderboard,
      getLastWeekTransactions: [],
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

  it('should correctly filter transactions by date: last week vs this week', async () => {
    // Create two users
    const sender1 = await prisma.user.create({
      data: {
        username: 'sender1',
        displayName: 'Sender 1',
        realName: 'Sender 1',
        avatarUrl: 'https://example.com/avatar.png',
        timezone: 'UTC',
        isBot: false,
        isActive: true,
        provider: 'slack',
        providerId: 'SENDER111',
      },
    })
    
    const receiver1 = await prisma.user.create({
      data: {
        username: 'receiver1',
        displayName: 'Receiver 1',
        realName: 'Receiver 1',
        avatarUrl: 'https://example.com/avatar.png',
        timezone: 'UTC',
        isBot: false,
        isActive: true,
        provider: 'slack',
        providerId: 'RECEIVER111',
      },
    })

    const sender2 = await prisma.user.create({
      data: {
        username: 'sender2',
        displayName: 'Sender 2',
        realName: 'Sender 2',
        avatarUrl: 'https://example.com/avatar.png',
        timezone: 'UTC',
        isBot: false,
        isActive: true,
        provider: 'slack',
        providerId: 'SENDER222',
      },
    })
    
    const receiver2 = await prisma.user.create({
      data: {
        username: 'receiver2',
        displayName: 'Receiver 2',
        realName: 'Receiver 2',
        avatarUrl: 'https://example.com/avatar.png',
        timezone: 'UTC',
        isBot: false,
        isActive: true,
        provider: 'slack',
        providerId: 'RECEIVER222',
      },
    })

    // Create transaction from last week (more than 7 days ago)
    const lastWeekDate = new Date()
    lastWeekDate.setDate(lastWeekDate.getDate() - 8) // 8 days ago
    await prisma.transaction.create({
      data: {
        amount: 50,
        fromUserId: sender1.id,
        toUserId: receiver1.id,
        total: 50,
        message: 'Last week karma',
        timestamp: lastWeekDate,
        fromUser: '<@SENDER111>',
        toUser: '<@RECEIVER111>',
      },
    })

    // Create transaction from this week (within last 7 days)
    const thisWeekDate = new Date()
    thisWeekDate.setDate(thisWeekDate.getDate() - 3) // 3 days ago
    await prisma.transaction.create({
      data: {
        amount: 100,
        fromUserId: sender2.id,
        toUserId: receiver2.id,
        total: 100,
        message: 'This week karma',
        timestamp: thisWeekDate,
        fromUser: '<@SENDER222>',
        toUser: '<@RECEIVER222>',
      },
    })

    await aiWeeklySummary('C123', 'prompt')

    // Expected results: getLastWeekTransactions should include transaction from last week (8 days ago)
    const expectedLastWeekTransactions = [
      {
        message: 'Last week karma',
        amount: 50,
        timestamp: lastWeekDate,
        newTotal: 50,
        fromName: 'Sender 1',
        toName: 'Receiver 1',
      },
    ]

    // Expected results: getLastWeekLeaderboard should include transaction from this week (3 days ago), NOT last week
    const expectedLastWeekLeaderboard = [
      {
        toRealName: 'Receiver 2',
        totalReceived: 100,
        rank: 1,
      },
    ]

    // Expected results: getTodayLeaderboard should include both transactions (all time up to today)
    const expectedTodayLeaderboard = [
      {
        toRealName: 'Receiver 2',
        totalReceived: 100,
        rank: 1,
      },
      {
        toRealName: 'Receiver 1',
        totalReceived: 50,
        rank: 2,
      },
    ]

    const expectedToolResults = {
      getLastWeekLeaderboard: expectedLastWeekLeaderboard,
      getLastWeekTransactions: expectedLastWeekTransactions,
      getTodayLeaderboard: expectedTodayLeaderboard,
    }

    // Verify the tool results passed to OpenAI
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
})