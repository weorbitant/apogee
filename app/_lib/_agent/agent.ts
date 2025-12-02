import { getLastWeekLeaderboard, getLastWeekTransactions, getTodayLeaderboard } from "../_db/index";
import { ChatCompletionCreateParams, createChatCompletion } from "../_openai/client";

interface UserInput {
  tools: string;
  prompt: string;
}

interface ToolCall {
  toolName: string;
  args: Record<string, unknown>;
}

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

async function callModelWithTools(
  userInput: UserInput
): Promise<ToolCall[] | null> {
  const params: ChatCompletionCreateParams = {
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: "You are an assistant that decides which tools to call based on user input."
      },
      {
        role: "user",
        content: JSON.stringify(userInput)
      }
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "getLastWeekLeaderboard",
          description: "Get the leaderboard for the last week",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "getLastWeekTransactions",
          description: "Get all transactions from the last week",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "getTodayLeaderboard",
          description: "Get the leaderboard for today",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      }
    ]
  };

  const completion = await createChatCompletion(params);
  const toolCalls: ToolCall[] = [];
  if (completion.choices[0]?.message?.tool_calls) {
    for (const toolCall of completion.choices[0].message.tool_calls) {
      if (toolCall.type === "function" && toolCall.function?.name) {
        toolCalls.push({
          toolName: toolCall.function.name,
          args: toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {}
        });
      }
    }
  }
  return toolCalls.length > 0 ? toolCalls : null;
}

async function callModelToComposeMessage(
  userInput: UserInput,
  toolResults: ToolResults
): Promise<string> {
  const params: ChatCompletionCreateParams = {
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: "Compose a human-readable message using the provided tool data."
      },
      {
        role: "user",
        content: JSON.stringify(userInput)
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
export async function processPrompt(tools: string, prompt: string): Promise<string> {
  const input: UserInput = {
    tools,
    prompt
  };

  console.log("🔹 Input del usuario:", input);

  // 1. First OpenAI call → ask model which tools to use
  const toolCalls = await callModelWithTools(input);

  if (!toolCalls) {
    console.log('No tools were selected by the model');
    throw new Error("No tools were selected by the model");
  }
  // 2. Execute the tools
  const toolResults: ToolResults = {};
  for (const call of toolCalls) {
    if (call.toolName === "getLastWeekLeaderboard") {
      toolResults.getLastWeekLeaderboard = await getLastWeekLeaderboard();
    }
    if (call.toolName === "getLastWeekTransactions") {
      toolResults.getLastWeekTransactions = await getLastWeekTransactions();
    }
    if (call.toolName === "getTodayLeaderboard") {
      toolResults.getTodayLeaderboard = await getTodayLeaderboard();
    }
  }

  // 3. Second call → compose final message
  return await callModelToComposeMessage(input, toolResults);
}

