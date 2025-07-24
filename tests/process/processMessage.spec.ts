import { describe, it, expect, vi, beforeEach } from 'vitest'
// Mock the DB and Slack modules to control their behavior and spy on calls


// 👇 mock both modules before importing the function under test
vi.mock('@/app/_lib/_db/index', () => ({
  storeKarma: vi.fn().mockResolvedValue([]),
  getGivenKarmaLast2Weeks: vi.fn().mockResolvedValue(0),
  getTakenKarmaLast2Weeks: vi.fn().mockResolvedValue(0),
}))

vi.mock('@/app/_lib/_slack', () => ({
  sendSlackMessages: vi.fn(),
}))

import { processMessage } from '@/app/_lib/_process'
import { storeKarma } from '@/app/_lib/_db'
import { sendSlackMessages } from '@/app/_lib/_slack'

const now = new Date('2025-07-24T10:22:01.237Z')

describe('processMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should process a message given karma to himself and should not store karma and send slack messages correctly', async () => {
    await processMessage({
      channel: 'C123',
      text: '<@USER11111> +++',
      user: 'USER11111',
    })
    // check storekarma and sendSlackMessages were called
    expect(storeKarma).toHaveBeenCalled()
    expect(sendSlackMessages).toHaveBeenCalled()
    // check parameters send correctly
    expect(storeKarma).toHaveBeenCalledWith([])
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
    expect(storeKarma).toHaveBeenCalled()
    expect(sendSlackMessages).toHaveBeenCalled()
    // check parameters send correctly
    expect(storeKarma).toHaveBeenCalledWith([
     {
       "amount": 2,
       "fromUser": "<@USER22222>",
       "message": "<@USER11111> +++",
       "timestamp": expect.any(Date),
       "toUser": "<@USER11111>",
     },
   ])
    expect(sendSlackMessages).toHaveBeenCalledWith({
      channel: 'C123',
      fromUser: '<@USER22222>',
      canGiveKarma: true,
      canTakeKarma: true,
      givenKarmasToHimself: false,
      takenKarmasFromHimself: false,
      affectedUsers: [],
    })
  })

  it('should process a message of a user <@grattitude-dev> +++ and should not store karma and send slack messages correctly', async () => {
    await processMessage({
      channel: 'C123',
      text: '<@grattitude-dev> +++',
      user: 'USER11111',
    })
    // check storekarma and sendSlackMessages were called
    expect(storeKarma).toHaveBeenCalled()
    expect(sendSlackMessages).toHaveBeenCalled()
    // check parameters send correctly
    expect(storeKarma).toHaveBeenCalledWith([
     {
       "amount": 2,
       "fromUser": "<@USER11111>",
       "message": "<@grattitude-dev> +++",
       "timestamp": expect.any(Date),
       "toUser": "<@grattitude-dev>",
     },
   ])
    expect(sendSlackMessages).toHaveBeenCalledWith({
      channel: 'C123',
      fromUser: '<@USER11111>',
      canGiveKarma: true,
      canTakeKarma: true,
      givenKarmasToHimself: false,
      takenKarmasFromHimself: false,
      affectedUsers: [],
    })
  })
})