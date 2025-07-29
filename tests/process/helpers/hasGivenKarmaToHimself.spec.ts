import { describe, it, expect } from 'vitest'
import { hasGivenKarmaToHimself, type Transaction } from '@/app/_lib/_process/helpers'

describe('hasGivenKarmaToHimself', () => {
  it('should return true if the user has given karma to himself', () => {
    const transactions: Transaction[] = [
      {
        message: 'test',
        fromUser: 'test',
        toUser: 'test',
        amount: 1,
        timestamp: new Date(),
      },
    ]

    const result = hasGivenKarmaToHimself(transactions)
    expect(result).toBe(true)
  })

  it('should return false if the user has not given karma to himself', () => {
    const transactions: Transaction[] = [
      {
        message: 'test',
        fromUser: 'test',
        toUser: 'test2',
        amount: 1,
        timestamp: new Date(),
      },
    ]

    const result = hasGivenKarmaToHimself(transactions)
    expect(result).toBe(false)
  })
})