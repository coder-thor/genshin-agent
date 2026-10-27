import readline from "node:readline/promises";
import { reply } from "./agents/tool-agent"; 
import { logAnswer, logRound } from "./utils/logger";
import { memory } from "./memory/full-history";

// stdio 父子进程的通信实例
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let round = 0;

console.log("你好，我是原神智能小助手，你可以问我原神相关的问题哦");

while (true) {
  // 持续等待终端的输入信息， 通过 input 接收用户的输入信息
  const input = await rl.question("\n你："); // 钟离的圣遗物搭配？
  if (input === "exit") break;

  round++; 
  logRound(round, input); // 打日志 记录 input 的值
  // 每次和 llm 交互的时候都是直接把用户的问题给丢进去了
  // 我们可以拿到用户的问题
  // 记住 memory 本身就是 agent 工程师最基本的知识
  memory.save({ role: "user", content: input })
  const answer = await reply(input, memory.load());
  memory.save({role: "assistant", content: answer})
  logAnswer(answer);
  console.log("助手：", answer);
}
rl.close();
