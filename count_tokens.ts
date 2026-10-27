import { AutoTokenizer, env } from "@huggingface/transformers";
import { client } from "./deepseek";

// DeepSeek 公开的分词器文件，和线上模型同一套词表
env.allowRemoteModels = false;
env.localModelPath = import.meta.dir;
const tokenizer = await AutoTokenizer.from_pretrained("tokenizer");
const count = (text: string) => tokenizer.encode(text, { add_special_tokens: false }).length;

const system = "你是一个原神助手，每次回答不超过两句话。";
const question = "胡桃的元素战技会消耗生命值，换来攻击力提升。";

const resp = await client.chat.completions.create({
  model: "deepseek-flash",
  messages: [
    { role: "system", content: system },
    { role: "user", content: question },
  ],
  max_tokens: 50,
  thinking: { type: "disabled" },
});

const promptTokens = resp.usage!.prompt_tokens;
console.log("本地数：问题", count(question), "个 token，系统提示词", count(system), "个 token");
console.log("接口说：输入一共", promptTokens, "个 token");
console.log("差了", promptTokens - count(question) - count(system), "个");
