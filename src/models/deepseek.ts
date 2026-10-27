import OpenAI from "openai";
import { log } from "../utils/logger";

declare module "openai/resources/chat/completions/completions" {
  interface ChatCompletionCreateParamsBase {
    thinking?: { type: "enabled" | "disabled" };
  }
}

export type Message = OpenAI.Chat.ChatCompletionMessageParam;
export type ToolDefinition = OpenAI.Chat.ChatCompletionFunctionTool;

// deepseek 为什么是 openai?  openai定义了一套 llm 的交互标准 然后 deepseek实现了这套标准
const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com", // 是 deepseek 的地址
});


export async function callModel(messages: Message[], tools?: ToolDefinition[]) {
  const request = {
    model: "deepseek-flash", //调用的 llm 模型
    messages, // 刚刚那个数组 [{role: system, content: 提示词}, { role: user, content: 钟离的圣遗物搭配 }]
    tools,
    thinking: { type: "disabled" as const },
  };
  log("请求", request);
  
  // 就是在和 deepseek的 llm 交互
  const resp = await client.chat.completions.create(request);
  log("返回", resp);

  const usage = resp.usage!;
  console.log(`[输入 ${usage.prompt_tokens} 个 token · 输出 ${usage.completion_tokens} 个 token]`);
  return resp.choices[0].message;
}
