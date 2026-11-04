import { Hono } from "hono";
import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { login, userIdOf } from "../auth/tokens";
import { listSessions, startSessionTurn } from "../sessions/store";
import { runTurn } from "../sessions/turn";

type Env = { Variables: { userId: string } };

export const app = new Hono<Env>(); // hono是一个 nodejs 的 http 处理框架 koa express 封装了一些 http 传输层的实现细节， 它可以让你不用去处理底层的 http 报文

// 客户端调用/login接口的时候 浏览器的事件监听
app.post("/login", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "请求体不是 JSON" }, 400);
  }
  const userId = typeof body === "object" && body !== null && "userId" in body ? body.userId : undefined;
  if (typeof userId !== "string" || userId.length === 0) return c.json({ error: "缺少 userId" }, 400);
  const token = login(userId);
  console.log(`用户 ${userId} 登录`);
  return c.json({ token, userId });
});

// 这个中间件是在请求进来的最开始就会触发
app.use("*", async (c, next) => {
  const header = c.req.header("authorization");
  // abc 
  // abc 
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  const userId = token === null ? null : userIdOf(token); // 通过 token 拿到对应的 userid
  if (!userId) return c.json({ error: "未登录" }, 401);
  c.set("userId", userId); // 在整个请求上下文里注入 userid
  await next();
});

// get请求， 意味着只要客户端去调用 GET /session 接口就会进入这个回调, 获取用户的所有会话 codex cursor 聊天窗口 就是一次会话
app.get("/sessions", (c) => {
  const userId = c.get("userId");
  const items = listSessions(userId);
  console.log(`用户 ${userId} 查看会话，共 ${items.length} 个`);
  return c.json({ sessions: items });
});

app.post("/messages", (c) => messageTurn(c));
app.post("/sessions/:id/messages", (c) => messageTurn(c, c.req.param("id")));

// 两条发消息的路由都进这里。没有 sessionId 就是第一条消息，顺手建会话；有 sessionId 就接着这个会话说。
// 响应不是一次性 JSON，而是 SSE：先推 session，再推 token，最后 done。
// case 1：POST /messages { text: "胡桃是什么元素" } → 新建会话，客户端从第一条事件拿到 sessionId。 session
// case 2：POST /sessions/fb80…/messages { text: "那武器呢" } → 还是这个会话，历史会一起带上。
async function messageTurn(c: Context<Env>, sessionId?: string) {
  let body: unknown;
  try {
    body = await c.req.json(); // hono的.json只要没有报错 那么得到的结果呢肯定 object
  } catch {
    return c.json({ error: "请求体不是 JSON" }, 400);
  }
  // 如果是 json 就要对 json 的内容进行一定的审核和验证， 并且 body 的对象里有 text 字段
  // { text: "xxx" } { text： "薇斯纳的圣遗物推荐" }
  const text = typeof body === "object" && body !== null && "text" in body ? body.text : undefined;
  if (typeof text !== "string" || text.length === 0) return c.json({ error: "缺少 text" }, 400);

  const userId = c.get("userId");
  // 如果有 sessionid 就复用之前的 session 并带上历史记录， 如果没有呢就创建新的 session
  const started = startSessionTurn(userId, sessionId);
  if (!started.ok) {
    if (started.error === "forbidden") {
      console.log(`用户 ${userId} 拒绝访问会话 ${sessionId ?? ""}`); // 用户拿到了别人的 sessionid 想尝试获取别人的会话
      return c.json({ error: "这个会话不属于当前用户" }, 403);
    }
    // 就是比如你的账号登在多个客户端上面， 
    if (started.error === "busy") return c.json({ error: "这一轮还没结束" }, 409);
    return c.json({ error: "没有这个会话" }, 404);
  }

  // 所有验证都弄好了
  if (started.created) console.log(`用户 ${userId} 创建会话 ${started.session.id}`);
  console.log(`用户 ${userId} 会话 ${started.session.id} 收到消息：${text}`);
  const id = started.session.id;
  // 返回一个 sse 的连接 http post 请求 服务端它可以决定这次请求是 sse 还是短链接的 post http content-type: text/event-stream 
  return streamSSE(c, async (stream) => {
    // 发送第一个消息： 就是把 sessionid 给到客户端
    await stream.writeSSE({ event: "session", data: JSON.stringify({ sessionId: id }) });
    await runTurn(userId, id, text, (event, data) => stream.writeSSE({ event, data: JSON.stringify(data) }));
  });
}

export function listen(port = 3000) {
  // 监听本机的 3000 端口
  Bun.serve({ port, hostname: "127.0.0.1", fetch: app.fetch });
  console.log(`http://127.0.0.1:${port}`);
}
