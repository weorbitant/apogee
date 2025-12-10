import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/ai-weekly-summary/route'

describe('aiWeeklySummary', () => {
  it('should return a 401 response if the authorization header is incorrect', async () => {
    const request = new Request('http://localhost:3000/api/ai-weekly-summary', {
      method: 'POST',
      body: JSON.stringify({
        channel: 'C123',
        tools: 'tools',
        prompt: 'prompt',
      }),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('should return a 400 response if the required fields are missing', async () => {
    process.env.API_KEY = '1234567890'
    const request = new Request('http://localhost:3000/api/ai-weekly-summary', {
      method: 'POST',
      body: JSON.stringify({
        channel: 'C123',
        tools: 'tools',
      }),
      headers: {
        'Authorization': '1234567890',
      },
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})