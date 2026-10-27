import OpenAI from "openai";

// DeepSeek 兼容 OpenAI 格式，但多了几个字段，OpenAI SDK 的类型里没有，这里补上
declare module "openai/resources/chat/completions/completions" {
  interface ChatCompletionCreateParamsBase {
    thinking?: { type: "enabled" | "disabled" };
  }
}
declare module "openai/resources/completions" {
  interface CompletionUsage {
    prompt_cache_hit_tokens?: number;
    prompt_cache_miss_tokens?: number;
  }
}

export type Message = OpenAI.Chat.ChatCompletionMessageParam;

// Bun 会自动读取 .env，不需要 dotenv
export const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});
