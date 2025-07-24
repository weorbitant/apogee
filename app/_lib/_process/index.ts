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
  getGivenKarmaLast2Weeks,
  getTakenKarmaLast2Weeks,
  storeKarma,
} from '@/app/_lib/_db/index'
import { sendSlackMessages } from '@/app/_lib/_slack'

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
  // TODO @gratitude-dev -- doesn't work
  // TODO remove this logs
  console.log('event', event)
  const { channel, text, user } = event
  const now = new Date()
  const fromUser = `<@${user}>`

  try {
    // Find karma realed mentions
    const karmaRelatedMatches = [...text.matchAll(REGEX)].map(
      (match) => match[0]
    )
    // TODO remove this logs
    console.log('text', text)
    console.log('karmaRelatedMatches', karmaRelatedMatches)

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

      // TODO remove this logs
      console.log('karmaRelatedMatches', karmaRelatedMatches)
      console.log('transactions', transactions)
      console.log('validTransactions', validTransactions)

      console.log('givenKarmasToHimself', givenKarmasToHimself)
      console.log('takenKarmasFromHimself', takenKarmasFromHimself)
      console.log('totalKarmaToGive', totalKarmaToGive)
      console.log('totalKarmaToTake', totalKarmaToTake)

      console.log('givenKarmaLast2Weeks', givenKarmaLast2Weeks)
      console.log('takenKarmaLast2Weeks', takenKarmaLast2Weeks)
      console.log('canGiveKarma', canGiveKarma)
      console.log('canTakeKarma', canTakeKarma)

      console.log('affectedUsers', affectedUsers)
    }
  } catch (error) {
    console.log('error', error)
    throw error
  }
}
