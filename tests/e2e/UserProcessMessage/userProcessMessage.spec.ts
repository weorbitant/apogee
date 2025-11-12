import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processMessage } from '@/app/_lib/_process'
import { prisma } from '@/app/_lib/_db'
import user1 from './mocks/user1.json'
import userTo from './mocks/userTo.json'

vi.mock('@/app/_lib/_slack', () => ({
  sendSlackMessages: vi.fn(),
  getUserInfo: vi.fn().mockResolvedValue(null),
}))

import { getUserInfo, sendSlackMessages } from '@/app/_lib/_slack'

describe('processMessageDB post to user table migration', () => {
  const user1Id = 'U096G3T569M'
  beforeEach(async () => {
    vi.clearAllMocks()
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

  it.only('should process a message given karma to a new user and should store karma and send slack messages correctly', async () => {
    vi.mocked(getUserInfo).mockResolvedValue(userTo).mockResolvedValueOnce(user1)
    await processMessage({
      channel: 'C123',
      text: `<@${userTo.id}> +++`,
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
    // userTo
    expect(users[1].id).toBeTypeOf('string')
    expect(users[1].providerId).toBe(userTo.id)
    expect(users[1].username).toBe(userTo.name)
    expect(users[1].displayName).toBe(userTo.profile.display_name)
    expect(users[1].realName).toBe(userTo.profile.real_name)
    expect(users[1].avatarUrl).toBe(userTo.profile.image_original)
    expect(users[1].timezone).toBe(userTo.tz)
    expect(users[1].isBot).toBe(userTo.is_bot)
    expect(users[1].isActive).toBe(true)
    expect(users[1].provider).toBe('slack')
    expect(users[1].createdAt).toBeInstanceOf(Date)
    expect(users[1].updatedAt).toBeInstanceOf(Date)
    // check storekarma and sendSlackMessages were called
    const transactions = await prisma.transaction.findMany()
    expect(transactions.length).toBe(1)
    expect(transactions[0].fromUser).toBe(`<@${user1Id}>`)
    expect(transactions[0].toUser).toBe(`<@${userTo.id}>`)
    expect(transactions[0].amount).toBe(2)
    expect(transactions[0].message).toBe(`<@${userTo.id}> +++`)
    expect(transactions[0].fromUserId).toBe(users[0].id)
    expect(transactions[0].toUserId).toBeNull()
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
          toUser: `<@${userTo.id}>`,
        },
      ],
    })
  })

  it('should process a message of a user <@grattitude-dev> +++ and should store karma and send slack messages correctly', async () => {
    await processMessage({
      channel: 'C123',
      text: '<@grattitude-dev> +++',
      user: 'USER11111',
    })
    // check storekarma and sendSlackMessages were called
    const transactions = await prisma.transaction.findMany()
    expect(transactions.length).toBe(1)
    expect(transactions[0].fromUser).toBe('<@USER11111>')
    expect(transactions[0].toUser).toBe('<@grattitude-dev>')
    expect(transactions[0].amount).toBe(2)
    expect(transactions[0].message).toBe('<@grattitude-dev> +++')
    expect(transactions[0].timestamp).toBeInstanceOf(Date)
    expect(sendSlackMessages).toHaveBeenCalledWith({
      channel: 'C123',
      fromUser: '<@USER11111>',
      canGiveKarma: true,
      canTakeKarma: true,
      givenKarmasToHimself: false,
      takenKarmasFromHimself: false,
      affectedUsers: [
        {
          oldTotal: 0,
          newTotal: 2,
          toUser: '<@grattitude-dev>',
        },
      ],
    })
  })

  it('should process multiple karma messages for different users', async () => {
    await processMessage({
      channel: 'C123',
      text: '<@USER11111> +++ <@USER33333> +++',
      user: 'USER22222',
    })
    const transactions = await prisma.transaction.findMany()
    expect(transactions.length).toBe(2)
    expect(transactions[0].fromUser).toBe('<@USER22222>')
    expect(transactions[0].toUser).toBe('<@USER11111>')
    expect(transactions[0].amount).toBe(2)
    expect(transactions[0].message).toBe('<@USER11111> +++ <@USER33333> +++')
    expect(transactions[0].timestamp).toBeInstanceOf(Date)
    expect(transactions[0].fromUserId).toBeNull()
    expect(transactions[0].toUserId).toBeNull()
    expect(transactions[1].fromUser).toBe('<@USER22222>')
    expect(transactions[1].toUser).toBe('<@USER33333>')
    expect(transactions[1].amount).toBe(2)
    expect(transactions[1].message).toBe('<@USER11111> +++ <@USER33333> +++')
    expect(transactions[1].timestamp).toBeInstanceOf(Date)
    expect(transactions[1].fromUserId).toBeNull()
    expect(transactions[1].toUserId).toBeNull()
    expect(sendSlackMessages).toHaveBeenCalledWith({
      channel: 'C123',
      fromUser: '<@USER22222>',
      canGiveKarma: true,
      canTakeKarma: true,
      givenKarmasToHimself: false,
      takenKarmasFromHimself: false,
      affectedUsers: [
        {
          oldTotal: 0,
          newTotal: 2,
          toUser: '<@USER11111>',
        },
        {
          oldTotal: 0,
          newTotal: 2,
          toUser: '<@USER33333>',
        },
      ],
    })
  })
})