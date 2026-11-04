import { reply } from "../agents/tool-agent";
import { append, getSession, load, nextSeq } from "./store";

export async function runTurn(
  userId: string,
  sessionId: string,
  text: string, // 薇斯纳的圣遗物推荐
  send: (event: string, data: unknown) => void | Promise<void>,
) {
  const session = getSession(userId, sessionId);
  if (session === "forbidden" || session === null) return;
  append(userId, sessionId, { role: "user", content: text });
  const histories = load(userId, sessionId); // 是不是已经有了薇斯纳圣遗物推荐了
  if (histories === "forbidden" || histories === null) {
    session.running = false;
    return;
  }
  try {
    // 为什么reply 不需要传 question 了，因为 question 已经在上面 append 了把
    // answer拿到的是全量的llm响应内容： 薇斯纳是五星单手剑角色
    const answer = await reply(histories, (delta) => {
      // 接收 delta 作为参数： delta 就是 llm 基于流式输出返回的一块又一块的 token
      // 薇斯纳是五星单手剑角色
      void send("token", { seq: nextSeq(session), text: delta }); // seq的作用是保护顺序 0   1  2 
      // { text: "薇", seq: 0 }
    });
    // append 是在给 session 的 message 里丢历史记录
    append(userId, sessionId, { role: "assistant", content: answer });
    await send("done", { seq: nextSeq(session), text: answer });
    // 客户端收到 sse 的事件是 done 的时候可能就知道是结束了
    // 收到 token 的时候 就知道来了一个字， 就可以直接在公屏输出对吧
    console.log(`用户 ${userId} 会话 ${sessionId} 本轮结束`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "本轮失败";
    await send("error", { seq: nextSeq(session), message });
    console.log(`用户 ${userId} 会话 ${sessionId} 本轮失败：${message}`);
  } finally {
    session.running = false;
  }
}
