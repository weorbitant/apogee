import { processPrompt } from "../_agent/agent"
import { sendPromptMessage } from '@/app/_lib/_slack'

export const aiWeeklySummary = async (channel: string, tools: string, prompt: string) => {
  const response = await processPrompt(tools, prompt)
  console.log('sending slack message to channel', channel)
  await sendPromptMessage(channel, response);
}