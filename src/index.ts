import readline from "node:readline/promises";
import { reply } from "./agents/tool-agent"; // 不带工具：改成 "./agents/chat"
import { createMemory } from "./memory/full-history"; // 不带历史：改成 "./memory/no-history"
import { logRound } from "./utils/logger";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const memory = createMemory();
let round = 0;

while (true) {
  const input = await rl.question("\n你：");
  if (input === "exit") break;

  round++;
  logRound(round);
  memory.add({ role: "user", content: input });
  console.log("助手：", await reply(memory));
}
rl.close();
