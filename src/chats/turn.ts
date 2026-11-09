import { reply } from "../agents/tool-agent";
import { logLine } from "../utils/logger";
import { append, finishChatTurn, getChat, load, nextSeq } from "./store";

export async function runTurn(
  userId: string,
  chatId: string,
  text: string,
  send: (event: string, data: unknown) => void | Promise<void>,
) {
  const chat = getChat(userId, chatId);
  if (chat === "forbidden" || chat === null) return;
  logLine(`role: user --- ${text}`);
  append(userId, chatId, { role: "user", content: text });
  const histories = load(userId, chatId);
  if (histories === "forbidden" || histories === null) {
    finishChatTurn(chatId);
    return;
  }
  try {
    // question 已经 append 进这个 chat，reply 只负责接着跑
    const answer = await reply(histories, async (delta) => {
      await send("token", { seq: nextSeq(chat), text: delta });
    }, (message) => { // onMessage
      append(userId, chatId, message);
    });
    logLine(`本轮响应回复 --- ${answer}`);
    await send("done", { seq: nextSeq(chat), text: answer });
    console.log(`用户 ${userId} 聊天 ${chatId} 本轮结束`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "本轮失败";
    await send("error", { seq: nextSeq(chat), message });
    console.log(`用户 ${userId} 聊天 ${chatId} 本轮失败：${message}`);
  } finally {
    finishChatTurn(chatId);
  }
}
