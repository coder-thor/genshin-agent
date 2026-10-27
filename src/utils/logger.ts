import { appendFileSync } from "node:fs";
import { join } from "node:path";

// 每次发给模型的完整请求、模型返回的完整内容，都追加到这个文件
const LOG_FILE = join(import.meta.dir, "../../log.txt");

appendFileSync(LOG_FILE, `\n########## 程序启动 · ${new Date().toLocaleString("zh-CN")} ##########\n`);

export function logRound(round: number, input: string) {
  appendFileSync(LOG_FILE, `\n===== 第 ${round} 轮 · ${new Date().toLocaleString("zh-CN")} =====\n`);
  appendFileSync(LOG_FILE, `>>> 用户输入：${input}\n\n`);
}

export function logAnswer(answer: string) {
  appendFileSync(LOG_FILE, `<<< 助手回答：${answer}\n`);
}

export function log(title: string, data: unknown) {
  appendFileSync(LOG_FILE, `--- ${title} ---\n${JSON.stringify(data, null, 2)}\n\n`);
}
