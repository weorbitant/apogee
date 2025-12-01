import { processKataPrompting } from "../_agent/agent"
import { sendKataPrompting } from '@/app/_lib/_slack'

export const kataPrompting = async (channel: string, tools: string, prompt: string) => {
  const response = await processKataPrompting(tools, prompt)
  await sendKataPrompting(channel, response);
}