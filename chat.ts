import { appendFileSync } from "node:fs";
import readline from "node:readline/promises";
import { client, type Message } from "./deepseek";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// 每轮发给模型的完整请求、模型返回的完整内容，都追加到这个文件
const LOG_FILE = "log.txt";
function log(title: string, data: unknown) {
  appendFileSync(LOG_FILE, `--- ${title} ---\n${JSON.stringify(data, null, 2)}\n\n`);
}

// 模型自己不记事，所有对话都存在这个数组里，每轮整个发过去
const messages: Message[] = [
  { role: "system", content: "你是“原神助手”，专门回答《原神》玩家的问题，回答简洁。" },
];
let round = 0;

while (true) {
  const userInput = await rl.question("\n你：");
  if (userInput === "exit") break;
  messages.push({ role: "user", content: userInput });

  round++;
  const request = {
    model: "deepseek-flash",
    messages,
    // 思考模式默认开启，这节课先关掉
    thinking: { type: "disabled" as const },
  };
  appendFileSync(LOG_FILE, `===== 第 ${round} 轮 · ${new Date().toLocaleString("zh-CN")} =====\n`);
  log("请求", request);

  const resp = await client.chat.completions.create(request);
  log("返回", resp);

  const reply = resp.choices[0].message.content ?? "";
  messages.push({ role: "assistant", content: reply });

  const usage = resp.usage!;
  console.log("助手：", reply);
  console.log(`[第 ${round} 轮] 输入 ${usage.prompt_tokens} 个 token · 输出 ${usage.completion_tokens} 个 token`);
}
rl.close();
