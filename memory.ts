import { client, type Message } from "./deepseek";

const SYSTEM: Message = { role: "system", content: "你是一个原神助手，每次回答不超过两句话。" };

async function ask(messages: Message[]) {
  const resp = await client.chat.completions.create({
    model: "deepseek-flash",
    messages,
    thinking: { type: "disabled" },
  });
  return resp.choices[0].message.content ?? "";
}

console.log("=== 两次独立请求 ===");
console.log("第 1 次：", await ask([SYSTEM, { role: "user", content: "我的主 C 是胡桃，副 C 是行秋。" }]));
console.log("第 2 次：", await ask([SYSTEM, { role: "user", content: "我的主 C 和副 C 是谁？" }]));

console.log("\n=== 把第 1 轮对话一起发过去 ===");
const firstUser: Message = { role: "user", content: "我的主 C 是胡桃，副 C 是行秋。" };
const firstReply = await ask([SYSTEM, firstUser]);
const history: Message[] = [
  SYSTEM,
  firstUser,
  { role: "assistant", content: firstReply },
  { role: "user", content: "我的主 C 和副 C 是谁？" },
];
console.log("第 2 次：", await ask(history));
