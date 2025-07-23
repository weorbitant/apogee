export type Transaction = {
  message: string
  fromUser: string
  toUser: string
  amount: number
  timestamp: Date
}

export function getTransactions(
  karmaRelatedMatches: string[],
  message: string,
  fromUser: string,
  now: Date
) {
  const transactions: Transaction[] = karmaRelatedMatches.map((match) => {
    // Extract the user ID
    const toUser = match.match(/<@U[A-Z0-9]{8,}>/)![0]
    // Extract the karma points
    const karmaString = match.match(/(\+{2,}|-{2,})/)![0]
    // Extract the karma amount (positive or negative)
    const amount = karmaString.startsWith('+')
      ? karmaString.length - 1
      : -karmaString.length + 1

    return {
      message,
      fromUser,
      toUser,
      amount,
      timestamp: now,
    }
  })
  return transactions
}

export function hasGivenKarmaToHimself(transactions: Transaction[]) {
  return transactions.some(
    (transaction) =>
      transaction.fromUser === transaction.toUser && transaction.amount > 0
  )
}

export function hasTakenKarmaFromHimself(transactions: Transaction[]) {
  return transactions.some(
    (transaction) =>
      transaction.fromUser === transaction.toUser && transaction.amount < 0
  )
}

export function getTransactionsNotToHimself(transactions: Transaction[]) {
  return transactions.filter((transaction) => {
    return transaction.fromUser !== transaction.toUser
  })
}

export function getTotalKarmaToGive(transactions: Transaction[]) {
  return transactions.reduce(
    (acc, curr) => acc + (curr.amount > 0 ? curr.amount : 0),
    0
  )
}

export function getTotalKarmaToTake(transactions: Transaction[]) {
  return transactions.reduce(
    (acc, curr) => acc + (curr.amount < 0 ? Math.abs(curr.amount) : 0),
    0
  )
}

export function getToStoreTransactions(
  transactions: Transaction[],
  canGiveKarma: boolean,
  canTakeKarma: boolean
) {
  let toStoreTransactions: Transaction[] = []

  if (canGiveKarma) {
    const positiveTransactions = transactions.filter(
      (transaction) => transaction.amount > 0
    )
    toStoreTransactions = [...toStoreTransactions, ...positiveTransactions]
  }

  if (canTakeKarma) {
    const negativeTransactions = transactions.filter(
      (transaction) => transaction.amount < 0
    )
    toStoreTransactions = [...toStoreTransactions, ...negativeTransactions]
  }

  return toStoreTransactions
}
