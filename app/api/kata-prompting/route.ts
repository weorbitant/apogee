import { kataPrompting } from '@/app/_lib/_process/kataPrompting';
import { waitUntil } from '@vercel/functions'

export const config = {
  maxDuration: 30,
}

interface KataPromptingRequest {
  channel: string;
  tools: string;
  prompt: string;
}

async function processKataPrompting(body: KataPromptingRequest) {
  // TODO: Implement kata prompting logic here
  const { tools, prompt, channel } = body
  await kataPrompting(channel, tools, prompt)
}

export async function POST(request: Request) {
  try {
    const body: KataPromptingRequest = await request.json()
    
    console.log('Kata prompting request:', JSON.stringify(body, null, 2))

    // Process the request asynchronously
    waitUntil(processKataPrompting(body))

    // Return immediate success response
    return Response.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error processing kata prompting request:', error)
    return Response.json({ success: false }, { status: 500 })
  }
}

