import { describe, it, expect, vi, beforeEach } from 'vitest'

// 👇 must be defined before imports
vi.mock('@slack/web-api', () => {
  const mockPostMessage = vi.fn().mockResolvedValue({ ok: true })

  const WebClient = vi.fn().mockImplementation(() => ({
    chat: {
      postMessage: mockPostMessage,
    },
  }))

  return {
    WebClient,
    mockPostMessage,
    __esModule: true,
  }
})

import { sendSlackMessages } from '../../app/_lib/_slack'
const { mockPostMessage } = await vi.importMock('@slack/web-api')

describe('sendSlackMessages', () => {
  beforeEach(() => {
    (mockPostMessage as ReturnType<typeof vi.fn>).mockClear()
  })

  it('sends a message if cannot give karma', async () => {
    await sendSlackMessages({
      channel: 'C123',
      fromUser: '<@U456>',
      canGiveKarma: false,
      canTakeKarma: true,
      givenKarmasToHimself: false,
      takenKarmasFromHimself: false,
      affectedUsers: [],
    })

    expect(mockPostMessage).toHaveBeenCalledWith({
      channel: 'C123',
      text: '<@U456> you have reached the meters\' limit. Being too generous lately?',
    })
  })

  it('sends a message if cannot take karma', async () => {
    await sendSlackMessages({
      channel: 'C123',
      fromUser: '<@U456>',
      canGiveKarma: true,
      canTakeKarma: false,
      givenKarmasToHimself: false,
      takenKarmasFromHimself: false,
      affectedUsers: [],
    })

    expect(mockPostMessage).toHaveBeenCalledWith({
      channel: 'C123',
      text: '<@U456> you have reached the meters\' limit. Being too mean lately?',
    })
  })

  it('sends a message if given karma to himself', async () => {
    await sendSlackMessages({
      channel: 'C123',
      fromUser: '<@U456>',
      canGiveKarma: true,
      canTakeKarma: true,
      givenKarmasToHimself: true,
      takenKarmasFromHimself: false,
      affectedUsers: [],
    })

    expect(mockPostMessage).toHaveBeenCalledWith({
      channel: 'C123',
      text: '<@U456> you can\'t give meters to yourself. Apogee is watching you!.',
    })
  })

  it('sends a message if taken karma from himself', async () => {
    await sendSlackMessages({
      channel: 'C123',
      fromUser: '<@U456>',
      canGiveKarma: true,
      canTakeKarma: true,
      givenKarmasToHimself: false,
      takenKarmasFromHimself: true,
      affectedUsers: [],
    })

    expect(mockPostMessage).toHaveBeenCalledWith({
      channel: 'C123',
      text: '<@U456> you can\'t take away meters from yourself. Apogee is watching you!.',
    })
  })

  it('sends a message if affected users', async () => {
    await sendSlackMessages({
      channel: 'C123',
      fromUser: '<@U456>',
      canGiveKarma: true,
      canTakeKarma: true,
      givenKarmasToHimself: false,
      takenKarmasFromHimself: false,
      affectedUsers: [
        {
          toUser: '<@U789>',
          oldTotal: 100,
          newTotal: 101,
        },
      ],
    })

    expect(mockPostMessage).toHaveBeenCalledWith({
      channel: 'C123',
      text: '<@U789>\'s apogee increased by 1 meters for a new value of 101.',
    })
  })

  it('sends a message if affected users decrease', async () => {
    await sendSlackMessages({
      channel: 'C123',
      fromUser: '<@U456>',
      canGiveKarma: true,
      canTakeKarma: true,
      givenKarmasToHimself: false,
      takenKarmasFromHimself: false,
      affectedUsers: [
        {
          toUser: '<@U789>',
          oldTotal: 100,
          newTotal: 99,
        },
      ],
    })

    expect(mockPostMessage).toHaveBeenCalledWith({
      channel: 'C123',
      text: '<@U789>\'s apogee decreased by 1 meters for a new value of 99.',
    })
  })

  it('send limit message and cannot give and take karma', async () => {
    await sendSlackMessages({
      channel: 'C123',
      fromUser: '<@U456>',
      canGiveKarma: false,
      canTakeKarma: false,
      givenKarmasToHimself: true,
      takenKarmasFromHimself: false,
      affectedUsers: [],
    })
    expect(mockPostMessage).toHaveBeenCalledTimes(3)
    expect(mockPostMessage).toHaveBeenNthCalledWith(1, {
      channel: 'C123',
      text: '<@U456> you have reached the meters\' limit. Being too generous lately?',
    })
    expect(mockPostMessage).toHaveBeenNthCalledWith(2, {
      channel: 'C123',
      text: '<@U456> you have reached the meters\' limit. Being too mean lately?',
    })
    expect(mockPostMessage).toHaveBeenNthCalledWith(3, {
      channel: 'C123',
      text: '<@U456> you can\'t give meters to yourself. Apogee is watching you!.',
    })
  })
})
