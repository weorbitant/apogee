import { UsersInfoResponse, WebClient } from '@slack/web-api'

const slack = new WebClient(process.env.SLACK_BOT_TOKEN)

export async function getUserInfo(userId: string): Promise<UsersInfoResponse['user'] | null> {
  const res = await slack.users.info({ user: userId })
  return res.ok ? res.user : null
}

export async function sendSlackMessages({  
  channel,
  fromUser,
  canGiveKarma,
  canTakeKarma,
  givenKarmasToHimself,
  takenKarmasFromHimself,
  affectedUsers,
}: {
  channel: string
  fromUser: string
  canGiveKarma: boolean
  canTakeKarma: boolean
  givenKarmasToHimself: boolean
  takenKarmasFromHimself: boolean
  affectedUsers: {
    toUser: string
    oldTotal: number
    newTotal: number
  }[]
}) {
  if (!canGiveKarma) {
    await slack.chat.postMessage({
      channel,
      text: `${fromUser} you have reached the meters' limit. Being too generous lately?`,
    })
  }
  if (!canTakeKarma) {
    await slack.chat.postMessage({
      channel,
      text: `${fromUser} you have reached the meters' limit. Being too mean lately?`,
    })
  }
  if (givenKarmasToHimself) {
    await slack.chat.postMessage({
      channel,
      text: `${fromUser} you can't give meters to yourself. Apogee is watching you!.`,
    })
  }
  if (takenKarmasFromHimself) {
    await slack.chat.postMessage({
      channel,
      text: `${fromUser} you can't take away meters from yourself. Apogee is watching you!.`,
    })
  }
  if (affectedUsers.length > 0) {
    for await (const affectedUser of affectedUsers) {
      if (affectedUser.oldTotal <= affectedUser.newTotal) {
        await slack.chat.postMessage({
          channel,
          text: `${affectedUser.toUser}'s apogee increased by ${Math.abs(
            affectedUser.newTotal - affectedUser.oldTotal
          )} meters for a new value of ${affectedUser.newTotal}.`,
        })
      } else {
        await slack.chat.postMessage({
          channel,
          text: `${affectedUser.toUser}'s apogee decreased by ${Math.abs(
            affectedUser.oldTotal - affectedUser.newTotal
          )} meters for a new value of ${affectedUser.newTotal}.`,
        })
      }
    }
  }
}
