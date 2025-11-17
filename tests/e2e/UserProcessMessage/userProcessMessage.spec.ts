import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processMessage } from '@/app/_lib/_process'
import { prisma } from '@/app/_lib/_db'
import user1 from './mocks/user1.json'
import user2 from './mocks/user2.json'
import user3 from './mocks/user3.json'
import botUser from './mocks/botUser.json'

vi.mock('@/app/_lib/_slack', () => ({
  sendSlackMessages: vi.fn(),
  getUserInfo: vi.fn().mockResolvedValue(null),
}))

import { getUserInfo, sendSlackMessages } from '@/app/_lib/_slack'

describe('processMessageDB post to user table migration', () => {
  const user1Id = 'U096G3T569M'
  beforeEach(async () => {
    vi.mocked(getUserInfo).mockRestore()
    await prisma.transaction.deleteMany({})
    await prisma.user.deleteMany({})
  })

  it('should process a message given karma to himself and should not store karma nor user and send slack messages correctly', async () => {
    vi.mocked(getUserInfo).mockResolvedValueOnce(user1)
    await processMessage({
      channel: 'C123',
      text: `<@${user1Id}> +++`,
      user: user1Id,
    })
    // check db empty
    const transactions = await prisma.transaction.findMany()
    expect(transactions.length).toBe(0)
    const users = await prisma.user.findMany()
    expect(users.length).toBe(0)
    expect(sendSlackMessages).toHaveBeenCalledWith({
      channel: 'C123',
      fromUser: `<@${user1Id}>`,
      canGiveKarma: true,
      canTakeKarma: true,
      givenKarmasToHimself: true,
      takenKarmasFromHimself: false,
      affectedUsers: [],
    })
  })

  it('should process a message given karma to a new user and should store karma and send slack messages correctly', async () => {
    vi.mocked(getUserInfo).mockResolvedValue(user2).mockResolvedValueOnce(user1)
    await processMessage({
      channel: 'C123',
      text: `<@${user2.id}> +++`,
      user: user1Id,
    })
    const users = await prisma.user.findMany()
    expect(users.length).toBe(2)
    // user1
    expect(users[0].id).toBeTypeOf('string')
    expect(users[0].providerId).toBe(user1.id)
    expect(users[0].username).toBe(user1.name)
    expect(users[0].displayName).toBe(user1.profile.display_name)
    expect(users[0].realName).toBe(user1.profile.real_name)
    expect(users[0].avatarUrl).toBe(user1.profile.image_original)
    expect(users[0].timezone).toBe(user1.tz)
    expect(users[0].isBot).toBe(user1.is_bot)
    expect(users[0].isActive).toBe(true)
    expect(users[0].provider).toBe('slack')
    expect(users[0].createdAt).toBeInstanceOf(Date)
    expect(users[0].updatedAt).toBeInstanceOf(Date)
    // user2
    expect(users[1].id).toBeTypeOf('string')
    expect(users[1].providerId).toBe(user2.id)
    expect(users[1].username).toBe(user2.name)
    expect(users[1].displayName).toBe(user2.profile.display_name)
    expect(users[1].realName).toBe(user2.profile.real_name)
    expect(users[1].avatarUrl).toBe(user2.profile.image_original)
    expect(users[1].timezone).toBe(user2.tz)
    expect(users[1].isBot).toBe(user2.is_bot)
    expect(users[1].isActive).toBe(true)
    expect(users[1].provider).toBe('slack')
    expect(users[1].createdAt).toBeInstanceOf(Date)
    expect(users[1].updatedAt).toBeInstanceOf(Date)
    // check storekarma and sendSlackMessages were called
    const transactions = await prisma.transaction.findMany()
    expect(transactions.length).toBe(1)
    expect(transactions[0].fromUser).toBe(`<@${user1Id}>`)
    expect(transactions[0].toUser).toBe(`<@${user2.id}>`)
    expect(transactions[0].amount).toBe(2)
    expect(transactions[0].message).toBe(`<@${user2.id}> +++`)
    expect(transactions[0].fromUserId).toBe(users[0].id)
    expect(transactions[0].toUserId).toBe(users[1].id)
    expect(transactions[0].timestamp).toBeInstanceOf(Date)
    expect(sendSlackMessages).toHaveBeenCalledWith({
      channel: 'C123',
      fromUser: `<@${user1Id}>`,
      canGiveKarma: true,
      canTakeKarma: true,
      givenKarmasToHimself: false,
      takenKarmasFromHimself: false,
      affectedUsers: [
        {
          oldTotal: 0,
          newTotal: 2,
          toUser: `<@${user2.id}>`,
        },
      ],
    })
  })

  it('should process a message of a user <@grattitude-dev> +++ and should store karma and send slack messages correctly', async () => {
    vi.mocked(getUserInfo).mockResolvedValue(botUser).mockResolvedValueOnce(user1)
    await processMessage({
      channel: 'C123',
      text: `<@${botUser.id}> +++`,
      user: user1.id,
    })
    const users = await prisma.user.findMany()
    expect(users.length).toBe(2)
    // check storekarma and sendSlackMessages were called
    const transactions = await prisma.transaction.findMany()
    expect(transactions.length).toBe(1)
    expect(transactions[0].fromUser).toBe(`<@${user1.id}>`)
    expect(transactions[0].toUser).toBe(`<@${botUser.id}>`)
    expect(transactions[0].amount).toBe(2)
    expect(transactions[0].message).toBe(`<@${botUser.id}> +++`)
    expect(transactions[0].timestamp).toBeInstanceOf(Date)
    expect(sendSlackMessages).toHaveBeenCalledWith({
      channel: 'C123',
      fromUser: `<@${user1.id}>`,
      canGiveKarma: true,
      canTakeKarma: true,
      givenKarmasToHimself: false,
      takenKarmasFromHimself: false,
      affectedUsers: [
        {
          oldTotal: 0,
          newTotal: 2,
          toUser: `<@${botUser.id}>`,
        },
      ],
    })
  })

  it('should process multiple karma messages for different users', async () => {
    vi.mocked(getUserInfo).mockResolvedValue(user3).mockResolvedValueOnce(user2).mockResolvedValueOnce(user1)
    await processMessage({
      channel: 'C123',
      text: `<@${user1.id}> +++ <@${user3.id}> +++`,
      user: user2.id,
    })
    const users = await prisma.user.findMany()
    expect(users.length).toBe(3)
    const user1Id = users.find(user => user.providerId === user1.id)?.id
    const user2Id = users.find(user => user.providerId === user2.id)?.id
    const user3Id = users.find(user => user.providerId === user3.id)?.id
    
    const transactions = await prisma.transaction.findMany()
    expect(transactions.length).toBe(2)
    expect(transactions[0].fromUser).toBe(`<@${user2.id}>`)
    expect(transactions[0].toUser).toBe(`<@${user1.id}>`)
    expect(transactions[0].amount).toBe(2)
    expect(transactions[0].message).toBe(`<@${user1.id}> +++ <@${user3.id}> +++`)
    expect(transactions[0].timestamp).toBeInstanceOf(Date)
    expect(transactions[0].fromUserId).toBe(user2Id)
    expect(transactions[0].toUserId).toBe(user1Id)
    expect(transactions[1].fromUser).toBe(`<@${user2.id}>`)
    expect(transactions[1].toUser).toBe(`<@${user3.id}>`)
    expect(transactions[1].amount).toBe(2)
    expect(transactions[1].message).toBe(`<@${user1.id}> +++ <@${user3.id}> +++`)
    expect(transactions[1].timestamp).toBeInstanceOf(Date)
    expect(transactions[1].fromUserId).toBe(user2Id)
    expect(transactions[1].toUserId).toBe(user3Id)
    expect(sendSlackMessages).toHaveBeenCalledWith({
      channel: 'C123',
      fromUser: `<@${user2.id}>`,
      canGiveKarma: true,
      canTakeKarma: true,
      givenKarmasToHimself: false,
      takenKarmasFromHimself: false,
      affectedUsers: [
        {
          oldTotal: 0,
          newTotal: 2,
          toUser: `<@${user1.id}>`,
        },
        {
          oldTotal: 0,
          newTotal: 2,
          toUser: `<@${user3.id}>`,
        },
      ],
    })
  })
})
