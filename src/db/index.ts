import { join } from "node:path";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { pushSQLiteSchema } from "drizzle-kit/api";
import { schema } from "./schema";

// src/db 再上两级就是项目根目录。
const file = join(import.meta.dir, "../../agent.sqlite");

const sqlite = new Database(file);
sqlite.run("PRAGMA foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// 表结构只写在 schema.ts 的模型上。启动时对照数据库，缺的表由 Drizzle 生成 SQL 再执行。
// drizzle-kit 的类型按 libsql 写，bun:sqlite 这份实例同样能对照模型建表。
const pushed = await pushSQLiteSchema(schema, db as unknown as Parameters<typeof pushSQLiteSchema>[1]);
if (pushed.statementsToExecute.length > 0) await pushed.apply();
