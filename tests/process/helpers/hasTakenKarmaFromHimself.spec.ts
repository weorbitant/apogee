import { describe, it, expect } from 'vitest'
import { hasTakenKarmaFromHimself, type Transaction } from '../../../app/_lib/_process/helpers'

describe('hasTakenKarmaFromHimself', () => {
  it('should return true if the user has taken karma from himself', () => {
    const transactions: Transaction[] = [
        {
          message: 'test',
          fromUser: 'test',
          toUser: 'test',
          amount: -1,
          timestamp: new Date(),
        },
      ]

    const result = hasTakenKarmaFromHimself(transactions)
    expect(result).toBe(true)
  })

  it('should return false if the user has not taken karma from himself', () => {
    const transactions: Transaction[] = [
      {
        message: 'test',
        fromUser: 'test',
        toUser: 'test2',
        amount: -1,
        timestamp: new Date(),
      },
    ]

    const result = hasTakenKarmaFromHimself(transactions)
    expect(result).toBe(false)
  })
})