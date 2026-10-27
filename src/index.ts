import readline from "node:readline/promises";
import { reply } from "./agents/chat"; 
import { createMemory } from "./memory/no-history"; 
import { logRound } from "./utils/logger";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const memory = createMemory();
let round = 0;

console.log("你好，我是原神智能小助手，你可以问我原神相关的问题哦");

while (true) {
  const input = await rl.question("\n你：");
  if (input === "exit") break;

  round++;
  logRound(round);
  memory.add({ role: "user", content: input });
  console.log("助手：", await reply(memory));
}
rl.close();
