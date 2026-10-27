import { appendFileSync } from "node:fs";

// 每次发给模型的完整请求、模型返回的完整内容，都追加到这个文件
const LOG_FILE = "log.txt";

export function logRound(round: number) {
  appendFileSync(LOG_FILE, `===== 第 ${round} 轮 · ${new Date().toLocaleString("zh-CN")} =====\n`);
}

export function log(title: string, data: unknown) {
  appendFileSync(LOG_FILE, `--- ${title} ---\n${JSON.stringify(data, null, 2)}\n\n`);
}
