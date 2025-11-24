import { prisma } from './instance'

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
 * Get leaderboard with total karma received per user (all time)
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
        date(t.timestamp) <= date('now')
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
 * Get all transactions from today with user details
 */
export async function getTodayLeaderboard(): Promise<LastWeekTransaction[]> {
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
    WHERE t.timestamp >= datetime('now')
      AND u_from.realName IS NOT NULL
      AND u_to.realName IS NOT NULL
    ORDER BY t.timestamp DESC
  `
  
  return result
}

