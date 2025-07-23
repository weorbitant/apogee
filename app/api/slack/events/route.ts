import crypto from 'crypto'
import { processMessage } from '@/app/_lib/_process'
import { waitUntil } from '@vercel/functions'

export const config = {
  maxDuration: 30,
}

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
  console.log('isValidSlackReq', isValidSlackReq)

  if (isValidSlackReq && requestType === 'event_callback') {
    const event = body.event
    const { type, channel } = event
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
  waitUntil(processRequest(request, rawBody))
  return new Response('OK', { status: 200 })
}
