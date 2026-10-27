import readline from "node:readline/promises";
import { logRound } from "./logger";
import { createMemory } from "./memory"; // 不带历史：改成 "./no-memory"
import { reply } from "./agent"; // 不带工具：改成 "./chat"

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
