import {
  Transaction,
  getTransactions,
  hasGivenKarmaToHimself,
  hasTakenKarmaFromHimself,
  getTransactionsNotToHimself,
  getTotalKarmaToTake,
  getTotalKarmaToGive,
  getToStoreTransactions,
} from '@/app/_lib/_process/helpers'
import {
  createUserIfNotExists,
  getGivenKarmaLast2Weeks,
  getTakenKarmaLast2Weeks,
  storeKarma,
} from '@/app/_lib/_db/index'
import { getUserInfo, sendSlackMessages } from '@/app/_lib/_slack'

type Event = {
  channel: string
  text: string
  user: string
}

// Examples of matching strings:
//  "<@U12345678> ++"
//  "<@grattitude-dev> ---"
const REGEX = /<@[^>]+> (\+{2,}|-{2,})/g
const LIMIT = 50

export async function processMessage(event: Event) {
  // TODO remove this logs
  const { channel, text, user } = event
  const now = new Date()
  const fromUser = `<@${user}>`

  try {
    // Find karma realed mentions
    const karmaRelatedMatches = [...text.matchAll(REGEX)].map(
      (match) => match[0]
    )

    if (karmaRelatedMatches.length > 0) {
      const transactions: Transaction[] = getTransactions(
        karmaRelatedMatches,
        text,
        fromUser,
        now
      )

      // find if user has given or taken karma to/from himself
      const givenKarmasToHimself = hasGivenKarmaToHimself(transactions)
      const takenKarmasFromHimself = hasTakenKarmaFromHimself(transactions)

      // get only the valid transactions (not to/from himself)
      const validTransactions = getTransactionsNotToHimself(transactions)

      // calculate the amount of karma that you are trying to give or take
      const totalKarmaToGive = getTotalKarmaToGive(validTransactions)
      const totalKarmaToTake = getTotalKarmaToTake(validTransactions)

      // retrieve from DB the used karma points given or taken in the last 2 weeks
      const [givenKarmaLast2Weeks, takenKarmaLast2Weeks] = await Promise.all([
        getGivenKarmaLast2Weeks(fromUser),
        getTakenKarmaLast2Weeks(fromUser),
      ])

      // check if the user can give or take karma
      const canGiveKarma = givenKarmaLast2Weeks + totalKarmaToGive <= LIMIT
      const canTakeKarma =
        Math.abs(takenKarmaLast2Weeks) + Math.abs(totalKarmaToTake) <= LIMIT

      // store the valid karma transactions into the DB
      const toStoreTransactions = getToStoreTransactions(
        validTransactions,
        canGiveKarma,
        canTakeKarma
      )
      const fromUsers = validTransactions.map(transaction => transaction.fromUser.replace('<@', '').replace('>', '').trim())
      const toUsers = validTransactions.map(transaction => transaction.toUser.replace('<@', '').replace('>', '').trim())
      const users = [...new Set([...fromUsers, ...toUsers])]
      for (let userToStore of users) {
        const userInfo = await getUserInfo(userToStore)
        console.log('userInfo', userInfo);
        
        if (userInfo && userInfo.id) {
          const profile = userInfo.profile ?? {}
          await createUserIfNotExists('slack', userInfo.id, {
            username: userInfo.name ?? '',
            displayName: profile.display_name ?? '',
            realName: profile.real_name ?? '',
            avatarUrl: profile.image_original ?? '',
            timezone: userInfo.tz,
            isBot: userInfo.is_bot,
            isActive: true,
          })
        }
      }
      const affectedUsers = await storeKarma(toStoreTransactions)

      // send messages to slack notifying the outcome of the process
      await sendSlackMessages({
        channel,
        fromUser,
        canGiveKarma,
        canTakeKarma,
        givenKarmasToHimself,
        takenKarmasFromHimself,
        affectedUsers,
      })
    }
  } catch (error) {
    console.log('error', error)
    throw error
  }
}
