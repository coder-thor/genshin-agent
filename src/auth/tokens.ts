import { ensureUser } from "../sessions/store";

// 临时的 token记录里拿到用户的 id
// jwt + redis  内存里的 map 对象去记录 登录的用户 及给他颁发 的 token
const tokens = new Map<string, string>();

export function login(userId: string) {
  ensureUser(userId);
  const token = crypto.randomUUID();
  tokens.set(token, userId);
  return token;
}

export function userIdOf(token: string) {
  return tokens.get(token) ?? null;
}
