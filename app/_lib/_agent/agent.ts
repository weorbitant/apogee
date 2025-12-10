import { getLastWeekLeaderboard, getLastWeekTransactions, getTodayLeaderboard } from "../_db/index";
import { ChatCompletionCreateParams, createChatCompletion } from "../_openai/client";

interface Leaderboard {
  toRealName: string;
  totalReceived: number;
  rank: number;
}

interface Transaction {
  message: string;
  amount: number;
  timestamp: Date;
  newTotal: number;
  fromName: string;
  toName: string;
}

interface ToolResults {
  getLastWeekLeaderboard?: Leaderboard[];
  getLastWeekTransactions?: Transaction[];
  getTodayLeaderboard?: Leaderboard[];
}

async function callModelToComposeMessage(
  prompt: string,
  toolResults: ToolResults
): Promise<string> {
  const params: ChatCompletionCreateParams = {
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: "Compose a human-readable message using the provided tool data, suitable for posting in Slack."
      },
      {
        role: "user",
        content: prompt,
      },
      {
        role: "system",
        content: "Here are the results from the tools: " + JSON.stringify(toolResults, null, 2)
      }
    ]
  };
  
  const completion = await createChatCompletion(params);
  return completion.choices[0]?.message?.content || "";
}

// ---- MAIN FUNCTION ------------------------
export async function processPrompt(prompt: string): Promise<string> {
  console.log("🔹 Input del usuario:", prompt);

  const toolResults: ToolResults = {};
  const toolsResults = await Promise.all([
    getLastWeekLeaderboard(),
    getLastWeekTransactions(),
    getTodayLeaderboard(),
  ]);

  toolResults.getLastWeekLeaderboard = toolsResults[0];
  toolResults.getLastWeekTransactions = toolsResults[1];
  toolResults.getTodayLeaderboard = toolsResults[2];

  return await callModelToComposeMessage(prompt, toolResults);
}

