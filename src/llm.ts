import OpenAI from "openai";
import { log } from "./logger";

// DeepSeek 兼容 OpenAI 格式，但多了 thinking 参数，OpenAI SDK 的类型里没有，这里补上
declare module "openai/resources/chat/completions/completions" {
  interface ChatCompletionCreateParamsBase {
    thinking?: { type: "enabled" | "disabled" };
  }
}

export type Message = OpenAI.Chat.ChatCompletionMessageParam;
export type Tool = OpenAI.Chat.ChatCompletionTool;

// Bun 会自动读取 .env，不需要 dotenv
const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

// 调一次模型：记日志、打印 token 用量，返回模型这次的回复
export async function callModel(messages: Message[], tools?: Tool[]) {
  const request = {
    model: "deepseek-flash",
    messages,
    tools,
    // 思考模式默认开启，这节课先关掉
    thinking: { type: "disabled" as const },
  };
  log("请求", request);
  const resp = await client.chat.completions.create(request);
  log("返回", resp);

  const usage = resp.usage!;
  console.log(`[输入 ${usage.prompt_tokens} 个 token · 输出 ${usage.completion_tokens} 个 token]`);
  return resp.choices[0].message;
}
