import { describe, it, expect } from 'vitest'
import { getToStoreTransactions, type Transaction } from '../../../app/_lib/_process/helpers'

describe('getToStoreTransactions', () => {
  it('should return the transactions that are positive', () => {
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
        toUser: 'test2',
        amount: -1,
        timestamp: new Date(),
      },
    ]

    const result = getToStoreTransactions(transactions, true, false)
    expect(result).toEqual([transactions[0]])
  })

  it('should return the transactions that are negative', () => {
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
        toUser: 'test2',
        amount: -1,
        timestamp: new Date(),
      },
    ]

    const result = getToStoreTransactions(transactions, false, true)
    expect(result).toEqual([transactions[1]])
  })

  it('should return the transactions that are positive and negative', () => {
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
        toUser: 'test2',
        amount: -1,
        timestamp: new Date(),
      },
    ]

    const result = getToStoreTransactions(transactions, true, true)
    expect(result).toEqual([transactions[0], transactions[1]])
  })
})