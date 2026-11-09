import { appendFileSync } from "node:fs";
import { join } from "node:path";

// 每一轮一行：用户、调用工具、查库、最后回复。
const LOG_FILE = join(import.meta.dir, "../../log.txt");

appendFileSync(LOG_FILE, `\n########## 程序启动 · ${new Date().toLocaleString("zh-CN")} ##########\n`);

export function logLine(text: string) {
  appendFileSync(LOG_FILE, text.replaceAll("\n", " ") + "\n");
}
