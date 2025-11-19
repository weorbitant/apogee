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
  getUserInfo: vi.fn().mockResolvedValue(null),
}))

import { processMessage } from '@/app/_lib/_process'
import { getGivenKarmaLast2Weeks, getTakenKarmaLast2Weeks, storeKarma } from '@/app/_lib/_db'
import { sendSlackMessages } from '@/app/_lib/_slack'

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

  it('should process a message but reach limit of 50 karma', async () => {
    // mock storeKarma to return 50 karma
    vi.mocked(getGivenKarmaLast2Weeks).mockResolvedValueOnce(50)
    vi.mocked(getTakenKarmaLast2Weeks).mockResolvedValueOnce(50)
    await processMessage({
      channel: 'C123',
      text: '<@USER11111> +++ <@USER33333> ---',
      user: 'USER22222',
    })
    // check storekarma and sendSlackMessages were called
    expect(storeKarma).toHaveBeenCalledWith([])
    expect(sendSlackMessages).toHaveBeenCalled()
    // check parameters send correctly
    expect(sendSlackMessages).toHaveBeenCalledWith({
      channel: 'C123',
      fromUser: '<@USER22222>',
      canGiveKarma: false,
      canTakeKarma: false,
      givenKarmasToHimself: false,
      takenKarmasFromHimself: false,
      affectedUsers: [],
    })
  })

  it('should throw exception when storeKarma fails', async () => {
    vi.mocked(storeKarma).mockRejectedValueOnce(new Error('Failed to store karma'))
    await expect(processMessage({
      channel: 'C123',
      text: '<@USER11111> +++',
      user: 'USER22222',
    })).rejects.toThrow('Failed to store karma')
  })
})