import { appendFileSync } from "node:fs";
import readline from "node:readline/promises";
import { client, type Message } from "./deepseek";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// 每次发给模型的完整请求、模型返回的完整内容，都追加到这个文件
const LOG_FILE = "log.txt";
function log(title: string, data: unknown) {
  appendFileSync(LOG_FILE, `--- ${title} ---\n${JSON.stringify(data, null, 2)}\n\n`);
}

// 【查角色工具】
// // 从社区整理的原神数据里，按名字查角色的星级、元素、武器
// async function getCharacter(name: string) {
//   const resp = await fetch("https://gi.yatta.moe/api/v2/chs/avatar");
//   const data = await resp.json();
//   const found: any = Object.values(data.data.items).find((c: any) => c.name === name);
//   if (!found) return { error: `没有找到角色：${name}` };
//   return { name: found.name, rarity: found.rank, element: found.element, weapon: found.weaponType };
// }
//
// // 告诉模型有这个工具：叫什么、能查什么、要传什么参数
// const tools = [
//   {
//     type: "function" as const,
//     function: {
//       name: "get_character",
//       description: "查询原神角色的基础资料：星级、元素、武器类型。",
//       parameters: {
//         type: "object",
//         properties: { name: { type: "string", description: "角色的中文名，比如“胡桃”" } },
//         required: ["name"],
//       },
//     },
//   },
// ];

// 模型自己不记事，所有对话都存在这个数组里，每次整个发过去
const messages: Message[] = [
  { role: "system", content: "你是“原神助手”，专门回答《原神》玩家的问题，回答简洁。" },
];
let round = 0;

while (true) {
  const userInput = await rl.question("\n你：");
  if (userInput === "exit") break;
  messages.push({ role: "user", content: userInput });

  round++;
  appendFileSync(LOG_FILE, `===== 第 ${round} 轮 · ${new Date().toLocaleString("zh-CN")} =====\n`);

  // 模型要调工具，就执行完把结果发回去再问一次，直到它直接回答
  while (true) {
    const request = {
      model: "deepseek-flash",
      messages,
      // 思考模式默认开启，这节课先关掉
      thinking: { type: "disabled" as const },
      // 【查角色工具】
      // tools,
    };
    log("请求", request);
    const resp = await client.chat.completions.create(request);
    log("返回", resp);

    const msg = resp.choices[0].message;
    messages.push(msg);

    const usage = resp.usage!;
    if (msg.content) console.log("助手：", msg.content);
    console.log(`[第 ${round} 轮] 输入 ${usage.prompt_tokens} 个 token · 输出 ${usage.completion_tokens} 个 token`);

    if (!msg.tool_calls?.length) break;

    // 【查角色工具】
    // for (const call of msg.tool_calls) {
    //   if (call.type !== "function") continue;
    //   const args = JSON.parse(call.function.arguments);
    //   const result = await getCharacter(args.name);
    //   console.log("[调用工具]", call.function.name, args, "=>", result);
    //   messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    // }
  }
}
rl.close();
