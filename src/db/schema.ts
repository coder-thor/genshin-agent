import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// 人。邮箱密码登录时，密码不在这张表上。
// 这个对象对应的 SQL：
// CREATE TABLE `user` (
//   `id` text PRIMARY KEY NOT NULL,
//   `name` text NOT NULL,
//   `email` text NOT NULL,
//   `email_verified` integer DEFAULT false NOT NULL,
//   `image` text,
//   `created_at` integer NOT NULL,
//   `updated_at` integer NOT NULL
// );
// CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);
// 没有 orm
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  // 邮箱是否验证过。当前注册流程不发验证信，默认 false。
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// 一次登录发出的 token(登录凭证，不是 ai)。不是聊天。  user表和 session 表都是交给 better auth 
// 登录凭证叫做 token != ai token 
export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  // 放进 Authorization: Bearer 的那串。
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

// 一种登录方式，挂在 user 上。邮箱密码是一行，以后换 Google 是另一行。
export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  // 这种登录方式那边的账号标识。邮箱密码时等于 user.id。
  accountId: text("account_id").notNull(),
  // credential 是邮箱密码。第三方登录时是 google 这类名字。
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  // 下面几列是第三方登录拿回来的令牌。邮箱密码用不到。
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
  scope: text("scope"),
  // 密码哈希。只有 providerId 为 credential 的那一行有值。
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// 验证码和重置密码的短时记录。当前邮箱密码流程不写这张表。
export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  // 验证的是谁，一般是邮箱。
  identifier: text("identifier").notNull(),
  // 发给对方的验证值。
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// 一次聊天。登录不会创建，第一条消息才会。
export const chats = sqliteTable("chats", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// 这个聊天里的每一条消息。顺序用自增 id。
export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chatId: text("chat_id").notNull().references(() => chats.id),
  // 整段消息的 JSON，包含 tool_calls 和 role 为 tool 的结果。
  body: text("body").notNull(),
});

export const schema = { user, session, account, verification, chats, chatMessages };
