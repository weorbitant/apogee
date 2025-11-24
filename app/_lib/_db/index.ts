import { v4 as uuidv4 } from 'uuid'
import { PrismaClient, type Transaction } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const libsql = createClient({
  url: `${process.env.TURSO_DATABASE_URL}`,
  authToken: `${process.env.TURSO_AUTH_TOKEN}`,
})

const adapter = new PrismaLibSQL(libsql)
export const prisma = new PrismaClient({ adapter })

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

interface User {
  username: string
  displayName: string
  realName?: string
  avatarUrl?: string
  timezone?: string
  isBot?: boolean
  isActive?: boolean
}

export const getUser = async (provider: string, providerId: string) => {
  return await prisma.user.findUnique({
    where: {
      provider_providerId: {
        provider: provider,
        providerId: providerId,
      },
    },
  })
}

export const createUserIfNotExists = async (provider: string, providerId: string, user: User) => {
  const existingUser = await getUser(provider, providerId)
  if (existingUser) {
    return existingUser
  }
  return await prisma.user.create({
    data: {
      provider: provider,
      providerId: providerId,
      ...user,
    },
  })
}

interface LastWeekTransaction {
  message: string
  amount: number
  timestamp: Date
  newTotal: number
  fromName: string
  toName: string
}

interface LeaderboardEntry {
  toRealName: string
  totalReceived: number
  rank: number
}

/**
 * Get all transactions from the last 7 days with user details
 */
export async function getLastWeekTransactions(): Promise<LastWeekTransaction[]> {
  const result = await prisma.$queryRaw<LastWeekTransaction[]>`
    SELECT
      t.message,
      t.amount,
      t.timestamp,
      t.total as "newTotal",
      u_from.realName AS fromName,
      u_to.realName AS toName
    FROM "Transaction" t
    JOIN "User" u_from ON u_from.id = t."fromUserId"
    JOIN "User" u_to ON u_to.id = t."toUserId"
    WHERE t.timestamp >= datetime('now', '-7 days')
      AND u_from.realName IS NOT NULL
      AND u_to.realName IS NOT NULL
    ORDER BY t.timestamp DESC
  `
  
  return result
}

/**
 * Get leaderboard with total karma received per user from last 7 days
 */
export async function getLastWeekLeaderboard(): Promise<LeaderboardEntry[]> {
  const result = await prisma.$queryRaw<LeaderboardEntry[]>`
    SELECT
      u.realName AS toRealName,
      q.totalReceived,
      q.rank
    FROM (
      SELECT
        t."toUserId",
        SUM(t.amount) AS totalReceived,
        ROW_NUMBER() OVER (ORDER BY SUM(t.amount) DESC) AS rank
      FROM "Transaction" t
      WHERE 
        t.timestamp >= datetime('now', '-7 days')
        AND t."toUserId" IS NOT NULL
      GROUP BY t."toUserId"
    ) q
    JOIN "User" u ON u.id = q."toUserId"
    WHERE u.realName IS NOT NULL
    ORDER BY q.rank ASC
  `
  
  return result
}

/**
 * Get leaderboard with total karma received per user from today (total karma)
 */
export async function getTodayLeaderboard(): Promise<LeaderboardEntry[]> {
  const result = await prisma.$queryRaw<LeaderboardEntry[]>`
    SELECT
      u.realName AS toRealName,
      q.totalReceived,
      q.rank
    FROM (
      SELECT
        t."toUserId",
        SUM(t.amount) AS totalReceived,
        ROW_NUMBER() OVER (ORDER BY SUM(t.amount) DESC) AS rank
      FROM "Transaction" t
      WHERE 
        date(t.timestamp) <= date('now')
        AND t."toUserId" IS NOT NULL
      GROUP BY t."toUserId"
    ) q
    JOIN "User" u ON u.id = q."toUserId"
    ORDER BY q.rank ASC;
  `
  
  return result
}
