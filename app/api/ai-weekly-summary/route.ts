import { aiWeeklySummary } from '@/app/_lib/_process/aiWeeklySummary';
import { waitUntil } from '@vercel/functions'

export const config = {
  maxDuration: 30,
}

interface AIWeeklySummaryRequest {
  channel: string;
  tools: string;
  prompt: string;
}

export async function POST(request: Request) {
  try {
    if (request.headers.get('Authorization') !== process.env.API_KEY) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const body: AIWeeklySummaryRequest = await request.json()

    if (!body.channel || !body.tools || !body.prompt) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }
    
    console.log('AI weekly summary request:', JSON.stringify(body, null, 2))

    // Process the request asynchronously
    waitUntil(aiWeeklySummary(body.channel, body.tools, body.prompt))

    // Return immediate success response
    return Response.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error processing ai weekly summary request:', error)
    return Response.json({ success: false }, { status: 500 })
  }
}
