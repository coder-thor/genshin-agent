import readline from "node:readline/promises";
import { client, type Message } from "./deepseek";

const SYSTEM_PROMPT = `你是“原神助手”，专门回答《原神》玩家的问题。
回答规则：
1. 每次回答不超过三句话，先给结论，再给理由。
2. 只回答和原神相关的问题，其他问题礼貌拒绝。
3. 玩家提到自己有哪些角色、练到什么程度时，要记住，并在后续回答中结合他的情况。
4. 推荐配队时，说明每个角色在队伍里的作用。
5. 推荐圣遗物和武器时，优先考虑玩家已有的，再给理想选择。
6. 不确定的信息，比如新版本角色的数值，要直接说明不确定，不要编造。
7. 不评价抽卡是否值得，不劝玩家氪金。
8. 涉及剧情时，先问玩家主线进度，避免剧透。
9. 玩家抱怨抽卡歪了或打不过深渊时，先安慰，再给具体可执行的建议。
10. 不使用表情符号，不使用 Markdown 标题和表格。
11. 如果问题太宽泛，先追问一个最关键的信息，再回答。
12. 游戏术语第一次出现时，用一句话解释，比如“主 C 就是队伍里主要打伤害的角色”。`;

// 故意设得很小，方便演示；真实项目会大得多
const BUDGET = 400;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const messages: Message[] = [{ role: "system", content: SYSTEM_PROMPT }];
let round = 0;
let lastPromptTokens = 0;

while (true) {
  const userInput = await rl.question("\n你：");
  if (userInput === "exit") break;

  // 上一轮输入已经超预算，就丢掉最早的一问一答（保留系统提示词）
  if (lastPromptTokens > BUDGET && messages.length > 3) {
    const [droppedUser] = messages.splice(1, 2);
    console.log(`[超预算，丢掉最早一轮：${droppedUser.content}]`);
  }

  messages.push({ role: "user", content: userInput });
  const stream = await client.chat.completions.create({
    model: "deepseek-flash",
    messages,
    stream: true,
    // 流式输出默认不带用量，要单独打开，最后一块会带上 usage
    stream_options: { include_usage: true },
    thinking: { type: "disabled" },
  });

  process.stdout.write("助手：");
  let reply = "";
  let usage;
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) {
      process.stdout.write(text);
      reply += text;
    }
    if (chunk.usage) usage = chunk.usage;
  }
  messages.push({ role: "assistant", content: reply });

  round++;
  lastPromptTokens = usage!.prompt_tokens;
  console.log(
    `\n[第 ${round} 轮] 输入 ${usage!.prompt_tokens} / 预算 ${BUDGET} · 输出 ${usage!.completion_tokens} · 命中缓存 ${usage!.prompt_cache_hit_tokens}`,
  );
}
rl.close();
