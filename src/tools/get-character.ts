import { eq } from "drizzle-orm";
import { db } from "../db";
import { characters } from "../db/schema";
import type { ToolDefinition } from "../models/deepseek";
import { logLine } from "../utils/logger";

export const definition: ToolDefinition = {
  type: "function",
  function: {
    name: "get_character",
    description: "只查本地角色表的星级、元素、武器类型。可莉、胡桃、钟离这类你知道的公开角色，禁止调用。只有你说不出这三项时才调用。返回没有找到时，才可以再调用 get_yatta 补角色资料。参数 name 是角色中文名。",
    parameters: {
      type: "object",
      properties: { name: { type: "string", description: "角色的中文名，比如“胡桃”" } },
      required: ["name"],
    },
  },
};

export async function run(args: { name: string }) {
  const row = db.select().from(characters).where(eq(characters.name, args.name)).get();
  logLine(`查询数据库 --- characters ${args.name} ${row ? "命中" : "未命中"}`);
  if (!row) return { error: `没有找到角色：${args.name}` };
  return { name: row.name, rank: row.rank, element: row.element, weaponType: row.weaponType };
}
