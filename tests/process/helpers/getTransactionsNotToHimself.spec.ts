import { describe, it, expect } from 'vitest'
import { getTransactionsNotToHimself, type Transaction } from '../../../app/_lib/_process/helpers'

describe('getTransactionsNotToHimself', () => {
  it('should return the transactions that are not to the user himself', () => {
    const transactions: Transaction[] = [
      {
        message: 'test',
        fromUser: 'test',
        toUser: 'test2',
        amount: 1,
        timestamp: new Date(),
      },
    ]

    const result = getTransactionsNotToHimself(transactions)
    expect(result).toEqual(transactions)
  })

  it('should return an empty array if there are only transactions to the user himself', () => {
    const transactions: Transaction[] = [
      {
        message: 'test',
        fromUser: 'test',
        toUser: 'test',
        amount: 1,
        timestamp: new Date(),
      },
    ]

    const result = getTransactionsNotToHimself(transactions)
    expect(result).toEqual([])
  })
})