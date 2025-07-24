import { describe, it, expect } from 'vitest'
import { getTotalKarmaToGive, getTotalKarmaToTake, Transaction } from '../../../app/_lib/_process/helpers'

describe('getTotalKarmaToGive', () => {
  it('should return the total karma to give', () => {
    const transactions: Transaction[] = [
      {
        message: 'test',
        fromUser: 'test',
        toUser: 'test2',
        amount: 1,
        timestamp: new Date(),
      },
      {
        message: 'test',
        fromUser: 'test',
        toUser: 'test3',
        amount: 1,
        timestamp: new Date(),
      },
    ]

    const result = getTotalKarmaToGive(transactions)
    expect(result).toBe(2)
  })
})

describe('getTotalKarmaToTake', () => {
  it('should return the total karma to take', () => {
    const transactions: Transaction[] = [
      {
        message: 'test',
        fromUser: 'test',
        toUser: 'test2',
        amount: -1,
        timestamp: new Date(),
      },
      {
        message: 'test',
        fromUser: 'test',
        toUser: 'test3',
        amount: -1,
        timestamp: new Date(),
      },
    ]

    const result = getTotalKarmaToTake(transactions)
    expect(result).toBe(2)
  })
})
