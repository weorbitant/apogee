import { getTransactions, Transaction } from '../../../app/_lib/_process/helpers'
import { describe, it, expect } from 'vitest'

describe('getTransactions', () => {
  const mockNow = new Date('2024-01-01T12:00:00Z')
  const mockFromUser = '<@U12345678>'
  const mockMessage = 'Great job on the project!'

  it('should create transactions for positive karma', () => {
    const karmaMatches = ['<@U87654321>+++']
    const expected: Transaction[] = [
      {
        message: mockMessage,
        fromUser: mockFromUser,
        toUser: '<@U87654321>',
        amount: 2, // +++ = 3-1 = 2
        timestamp: mockNow,
      },
    ]

    const result = getTransactions(karmaMatches, mockMessage, mockFromUser, mockNow)
    expect(result).toEqual(expected)
  })

  it('should create transactions for negative karma', () => {
    const karmaMatches = ['<@U87654321>---']
    const expected: Transaction[] = [
      {
        message: mockMessage,
        fromUser: mockFromUser,
        toUser: '<@U87654321>',
        amount: -2, // --- = -(3-1) = -2
        timestamp: mockNow,
      },
    ]

    const result = getTransactions(karmaMatches, mockMessage, mockFromUser, mockNow)
    expect(result).toEqual(expected)
  })

  it('should handle many pluses and minuses', () => {
    const karmaMatches = ['<@U87654321>++++++', '<@U11111111>------']
    const expected: Transaction[] = [
      {
        message: mockMessage,
        fromUser: mockFromUser,
        toUser: '<@U87654321>',
        amount: 5, // ++++++ = 6-1 = 5
        timestamp: mockNow,
      },
      {
        message: mockMessage,
        fromUser: mockFromUser,
        toUser: '<@U11111111>',
        amount: -5, // ------ = -(6-1) = -5
        timestamp: mockNow,
      },
    ]

    const result = getTransactions(karmaMatches, mockMessage, mockFromUser, mockNow)
    expect(result).toEqual(expected)
  })

  it('should return empty array for empty karma matches', () => {
    const karmaMatches: string[] = []
    const result = getTransactions(karmaMatches, mockMessage, mockFromUser, mockNow)
    expect(result).toEqual([])
  })

  it('should handle different user IDs', () => {
    const karmaMatches = ['<@U12345678>++', '<@UABCDEFGH>---']
    const expected: Transaction[] = [
      {
        message: mockMessage,
        fromUser: mockFromUser,
        toUser: '<@U12345678>',
        amount: 1,
        timestamp: mockNow,
      },
      {
        message: mockMessage,
        fromUser: mockFromUser,
        toUser: '<@UABCDEFGH>',
        amount: -2,
        timestamp: mockNow,
      },
    ]

    const result = getTransactions(karmaMatches, mockMessage, mockFromUser, mockNow)
    expect(result).toEqual(expected)
  })

  it('should handle different messages and from users', () => {
    const customMessage = 'Thanks for the help!'
    const customFromUser = '<@U99999999>'
    const karmaMatches = ['<@U87654321>+++']
    const expected: Transaction[] = [
      {
        message: customMessage,
        fromUser: customFromUser,
        toUser: '<@U87654321>',
        amount: 2,
        timestamp: mockNow,
      },
    ]

    const result = getTransactions(karmaMatches, customMessage, customFromUser, mockNow)
    expect(result).toEqual(expected)
  })
})
