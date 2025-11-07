import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/app/_lib/_slack', () => ({
  sendSlackMessages: vi.fn(),
}))

import { processMessage } from '@/app/_lib/_process'
import { getGivenKarmaLast2Weeks, getTakenKarmaLast2Weeks, prisma, storeKarma } from '@/app/_lib/_db'
import { sendSlackMessages } from '@/app/_lib/_slack'

describe('processMessage', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await prisma.transaction.deleteMany({})
  })

  it('should process a message given karma to himself and should not store karma and send slack messages correctly', async () => {
    await processMessage({
      channel: 'C123',
      text: '<@USER11111> +++',
      user: 'USER11111',
    })
    // check db empty
    const transactions = await prisma.transaction.findMany()
    expect(transactions.length).toBe(0)
    expect(sendSlackMessages).toHaveBeenCalledWith({
      channel: 'C123',
      fromUser: '<@USER11111>',
      canGiveKarma: true,
      canTakeKarma: true,
      givenKarmasToHimself: true,
      takenKarmasFromHimself: false,
      affectedUsers: [],
    })
  })

  it('should process a message given karma to a new user and should store karma and send slack messages correctly', async () => {
    await processMessage({
      channel: 'C123',
      text: '<@USER11111> +++',
      user: 'USER22222',
    })
    // check storekarma and sendSlackMessages were called
    const transactions = await prisma.transaction.findMany()
    expect(transactions.length).toBe(1)
    expect(transactions[0].fromUser).toBe('<@USER22222>')
    expect(transactions[0].toUser).toBe('<@USER11111>')
    expect(transactions[0].amount).toBe(2)
    expect(transactions[0].message).toBe('<@USER11111> +++')
    expect(transactions[0].timestamp).toBeInstanceOf(Date)
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
    expect(transactions[1].fromUser).toBe('<@USER22222>')
    expect(transactions[1].toUser).toBe('<@USER33333>')
    expect(transactions[1].amount).toBe(2)
    expect(transactions[1].message).toBe('<@USER11111> +++ <@USER33333> +++')
    expect(transactions[1].timestamp).toBeInstanceOf(Date)
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