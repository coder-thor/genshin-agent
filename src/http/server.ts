import { Hono } from "hono";
import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { auth } from "../auth/auth";
import { listChats, startChatTurn } from "../chats/store";
import { runTurn } from "../chats/turn";

type Env = { Variables: { userId: string } };

export const app = new Hono<Env>();

// 注册和登录走 Better Auth。必须写在鉴权中间件前面。
app.all("/api/auth/*", (c) => auth.handler(c.req.raw));

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "未登录" }, 401);
  c.set("userId", session.user.id);
  await next();
});

app.get("/chats", (c) => {
  const userId = c.get("userId");
  const items = listChats(userId);
  console.log(`用户 ${userId} 查看聊天，共 ${items.length} 个`);
  return c.json({ chats: items });
});

app.post("/messages", (c) => messageTurn(c));
app.post("/chats/:id/messages", (c) => messageTurn(c, c.req.param("id")));

// 两条发消息的路由都进这里。没有 chatId 就是第一条消息，顺手建聊天；有 chatId 就接着这个聊天说。
// 响应不是一次性 JSON，而是 SSE：先推 chat，再推 token，最后 done。
// case 1：POST /messages { text: "胡桃是什么元素" } → 新建聊天，客户端从第一条事件拿到 chatId。
// case 2：POST /chats/fb80…/messages { text: "那武器呢" } → 还是这个聊天，历史会一起带上。
async function messageTurn(c: Context<Env>, chatId?: string) {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "请求体不是 JSON" }, 400);
  }
  const text = typeof body === "object" && body !== null && "text" in body ? body.text : undefined;
  if (typeof text !== "string" || text.length === 0) return c.json({ error: "缺少 text" }, 400);

  const userId = c.get("userId");
  const started = startChatTurn(userId, chatId);
  if (!started.ok) {
    if (started.error === "forbidden") {
      console.log(`用户 ${userId} 拒绝访问聊天 ${chatId ?? ""}`);
      return c.json({ error: "这个聊天不属于当前用户" }, 403);
    }
    if (started.error === "busy") return c.json({ error: "这一轮还没结束" }, 409);
    return c.json({ error: "没有这个聊天" }, 404);
  }

  if (started.created) console.log(`用户 ${userId} 创建聊天 ${started.chat.id}`);
  console.log(`用户 ${userId} 聊天 ${started.chat.id} 收到消息：${text}`);
  const id = started.chat.id;
  return streamSSE(c, async (stream) => {
    await stream.writeSSE({ event: "chat", data: JSON.stringify({ chatId: id }) });
    await runTurn(userId, id, text, (event, data) => stream.writeSSE({ event, data: JSON.stringify(data) }));
  });
}

export function listen(port = 3000) {
  Bun.serve({ port, hostname: "127.0.0.1", fetch: app.fetch });
  console.log(`http://127.0.0.1:${port}`);
}
