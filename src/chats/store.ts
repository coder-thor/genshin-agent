import { asc, eq } from "drizzle-orm";
import type { Message } from "../models/deepseek";
import { db } from "../db";
import { chatMessages, chats } from "../db/schema";

export type Chat = {
  id: string;
  userId: string;
  running: boolean;
  seq: number;
};

const running = new Map<string, boolean>();
const seqs = new Map<string, number>();

export function openChat(userId: string) {
  const id = crypto.randomUUID();
  // 往数据库插入一条记录 往 chats 表插入
  // 之前我们是往内存里的 chats map 加记录对吧， 现在就是持久化到 db 里去了
  db.insert(chats).values({ id, userId, createdAt: new Date() }).run();
  return id;
}

export function getChat(userId: string, chatId: string) {
  const row = db.select().from(chats).where(eq(chats.id, chatId)).get();
  if (!row) return null;
  if (row.userId !== userId) return "forbidden" as const;
  return {
    id: row.id,
    userId: row.userId,
    running: running.get(row.id) ?? false,
    seq: seqs.get(row.id) ?? 0,
  } satisfies Chat;
}

export function listChats(userId: string) {
  return db.select().from(chats).where(eq(chats.userId, userId)).orderBy(asc(chats.createdAt)).all()
    .map((chat) => {
      const stored = db.select().from(chatMessages).where(eq(chatMessages.chatId, chat.id)).orderBy(asc(chatMessages.id)).all();
      const first = stored
        .map((row) => JSON.parse(row.body) as Message)
        .find((message) => message.role === "user" && typeof message.content === "string");
      return { id: chat.id, preview: typeof first?.content === "string" ? first.content : "" };
    });
}

export function load(userId: string, chatId: string) {
  const chat = getChat(userId, chatId);
  if (chat === "forbidden" || chat === null) return chat;
  return db.select().from(chatMessages).where(eq(chatMessages.chatId, chatId)).orderBy(asc(chatMessages.id)).all()
    .map((row) => JSON.parse(row.body) as Message);
}

export function append(userId: string, chatId: string, message: Message) {
  const chat = getChat(userId, chatId);
  if (chat === "forbidden" || chat === null) return chat;
  // 往数据库的 chatMessage表插入一条记录， 这个就等于是历史记录哈
  db.insert(chatMessages).values({ chatId, body: JSON.stringify(message) }).run();
  return chat;
}

export function nextSeq(chat: Chat) {
  const seq = chat.seq + 1;
  seqs.set(chat.id, seq);
  chat.seq = seq;
  return seq;
}

export function startChatTurn(userId: string, chatId?: string) {
  if (!chatId) { // 没有 chat 代表是要开一个新会话对吧
    const id = openChat(userId);
    const chat = getChat(userId, id);
    if (chat === "forbidden" || chat === null) return { ok: false as const, error: "missing" as const };
    running.set(id, true);
    chat.running = true;
    return { ok: true as const, chat, created: true };
  }
  // 带了 chatid 表示基于之前的聊天窗口继续聊
  const chat = getChat(userId, chatId);
  if (chat === "forbidden") return { ok: false as const, error: "forbidden" as const };
  if (chat === null) return { ok: false as const, error: "missing" as const };
  if (chat.running) return { ok: false as const, error: "busy" as const };
  running.set(chat.id, true);
  chat.running = true;
  return { ok: true as const, chat, created: false };
}

export function finishChatTurn(chatId: string) {
  running.set(chatId, false);
}
