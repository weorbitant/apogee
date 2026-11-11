import crypto from 'crypto'
import { processMessage } from '@/app/_lib/_process'
import { waitUntil } from '@vercel/functions'

export const maxDuration = 30

async function isValidSlackRequest(request: Request, rawBody: string) {
  // verify that the timestamp does not differ from local time by more than five minutes
  const timestamp = request.headers.get('X-Slack-Request-Timestamp')
  if (
    !timestamp ||
    Math.abs(Math.floor(new Date().getTime() / 1000) - +timestamp) > 300
  ) {
    return false
  }

  // verify that the signature is valid
  const signingSecret = process.env.SLACK_SIGNING_SECRET!
  const slackSignature = request.headers.get('X-Slack-Signature')
  const base = `v0:${timestamp}:${rawBody}`
  const hmac = crypto
    .createHmac('sha256', signingSecret)
    .update(base, 'utf8')
    .digest('hex')
  const computedSignature = `v0=${hmac}`
  return computedSignature === slackSignature
}

async function processRequest(request: Request, rawBody: string) {
  // process message
  const body = JSON.parse(rawBody)
  const requestType = body.type
  const isValidSlackReq = await isValidSlackRequest(request, rawBody)

  if (isValidSlackReq && requestType === 'event_callback') {
    const event = body.event
    const { type, channel, subtype, bot_id, text } = event
    // Skip bot messages (including our own replies), edits/deletes and other subtypes
    if (bot_id || subtype || typeof text !== 'string') {
      return
    }
    if (type === 'message' && channel === process.env.CHANNEL_ID) {
      await processMessage(event)
    }
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const body = JSON.parse(rawBody)
  const requestType = body.type
  console.log('request body', JSON.stringify(body, null, 2))

  // resolve challenge for first connection
  if (requestType === 'url_verification') {
    return new Response(body.challenge, { status: 200 })
  }
  // Slack retries an event if it doesn't get a 200 within 3s (e.g. cold start).
  // The first delivery is already being processed, so ack retries without reprocessing.
  if (request.headers.get('X-Slack-Retry-Num')) {
    console.log('ignoring slack retry', request.headers.get('X-Slack-Retry-Num'), request.headers.get('X-Slack-Retry-Reason'))
    return new Response('OK', { status: 200 })
  }
  waitUntil(processRequest(request, rawBody))
  return new Response('OK', { status: 200 })
}
