import type { Message } from "../models/deepseek";

export type Session = {
  id: string;
  userId: string;
  messages: Message[]; // 当前会话的所有历史记录
  running: boolean;
  seq: number;
};

const users = new Map<string, { id: string }>();
const sessions = new Map<string, Session>(); // 定义了一个内存里的变量

export function ensureUser(userId: string) {
  users.set(userId, { id: userId });
}

export function openSession(userId: string) {
  const id = crypto.randomUUID(); // 拿到一个随机的 sessionid 
  // messages数组存的就是历史记录 ， 一个 session 里面会有多轮会话对不对
  sessions.set(id, { id, userId, messages: [], running: false, seq: 0 });
  return id;
}

export function getSession(userId: string, sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (session.userId !== userId) return "forbidden" as const;
  return session;
}

export function listSessions(userId: string) {
  return [...sessions.values()]
    .filter((session) => session.userId === userId) // 过滤专属这个用户的 sesssion 记录 最基本的隔离性
    .map((session) => {
      // 一次会话呢是有多个请求 产生多轮对话 ， 找到用户发送的第一个问题 session 的第一个请求
      const first = session.messages.find((message) => message.role === "user" && typeof message.content === "string");
      return { id: session.id, preview: typeof first?.content === "string" ? first.content : "" };
    });
}

export function load(userId: string, sessionId: string) {
  const session = getSession(userId, sessionId);
  if (session === "forbidden" || session === null) return session;
  return session.messages;
}

export function append(userId: string, sessionId: string, message: Message) {
  const session = getSession(userId, sessionId);
  if (session === "forbidden" || session === null) return session;
  // save api专门保存 message 信息
  session.messages.push(message); // 薇斯纳的圣遗物推荐
  return session;
}

export function nextSeq(session: Session) {
  session.seq += 1;
  return session.seq;
}

export function startSessionTurn(userId: string, sessionId?: string) {
  if (!sessionId) {
    // 没有 session id 的情况就会  调用 opensession去新开一个 session 会话
    const id = openSession(userId);
    const session = sessions.get(id);
    if (!session) return { ok: false as const, error: "missing" as const };
    session.running = true;
    return { ok: true as const, session, created: true };
  }
  // 如果有 sessionid 代表是之前的会话
  const session = getSession(userId, sessionId);
  // 判断 session 的有效性
  if (session === "forbidden") return { ok: false as const, error: "forbidden" as const };
  if (session === null) return { ok: false as const, error: "missing" as const };
  if (session.running) return { ok: false as const, error: "busy" as const };
  session.running = true;
  return { ok: true as const, session, created: false };
}
