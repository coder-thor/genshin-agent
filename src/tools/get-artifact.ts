import { eq } from "drizzle-orm";
import { db } from "../db";
import { artifactRecommendations } from "../db/schema";
import type { ToolDefinition } from "../models/deepseek";
import { logLine } from "../utils/logger";

export const definition: ToolDefinition = {
  type: "function",
  function: {
    name: "get_artifact",
    description: "只查本地圣遗物推荐表，返回套装名列表。你说不出圣遗物推荐时才调用。说得出来就不要调用。返回的列表不是空的，就不要再调用 get_yatta。列表为空时，才可以调用 get_yatta 补这一项。参数 name 是角色中文名。",
    parameters: {
      type: "object",
      properties: { name: { type: "string", description: "角色的中文名，比如“米提亚”" } },
      required: ["name"],
    },
  },
};

export async function run(args: { name: string }) {
  const recs = db.select().from(artifactRecommendations).where(eq(artifactRecommendations.characterName, args.name)).all();
  const artifacts = recs.map((item) => item.setName);
  logLine(`查询数据库 --- artifact_recommendations ${args.name} ${artifacts.join("、") || "无"}`);
  return { name: args.name, artifacts };
}
