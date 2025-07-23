import { v4 as uuidv4 } from 'uuid'
import { Transaction } from '@prisma/client'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const libsql = createClient({
  url: `${process.env.TURSO_DATABASE_URL}`,
  authToken: `${process.env.TURSO_AUTH_TOKEN}`,
})

const adapter = new PrismaLibSQL(libsql)
const prisma = new PrismaClient({ adapter })

export async function getGivenKarmaLast2Weeks(user: string) {
  const givenKarmaLast2Weeks = await prisma.transaction.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      fromUser: user,
      amount: { gt: 0 },
      timestamp: {
        gte: new Date(Date.now() - 2 * 7 * 24 * 60 * 60 * 1000),
      },
    },
  })
  return givenKarmaLast2Weeks._sum.amount ?? 0
}

export async function getTakenKarmaLast2Weeks(user: string) {
  const takenKarmaLast2Weeks = await prisma.transaction.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      fromUser: user,
      amount: { lt: 0 },
      timestamp: {
        gte: new Date(Date.now() - 2 * 7 * 24 * 60 * 60 * 1000),
      },
    },
  })
  return takenKarmaLast2Weeks._sum.amount ?? 0
}

export async function storeKarma(
  transactions: Omit<Transaction, 'uuid' | 'total'>[]
) {
  const affectedUsers = []

  for await (const transaction of transactions) {
    const affectedUser = await prisma.transaction.findFirst({
      select: {
        total: true,
      },
      where: {
        toUser: transaction.toUser,
      },
      orderBy: {
        timestamp: 'desc',
      },
    })

    const affectedUserNewTotal = affectedUser
      ? affectedUser.total + transaction.amount
      : transaction.amount

    await prisma.transaction.create({
      data: {
        ...transaction,
        uuid: uuidv4(),
        total: affectedUserNewTotal,
      },
    })

    affectedUsers.push({
      oldTotal: affectedUser ? affectedUser.total : 0,
      newTotal: affectedUserNewTotal,
      toUser: transaction.toUser,
    })
  }

  return affectedUsers
}
