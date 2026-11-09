import { db } from "../db";
import { artifacts, characters, weapons } from "../db/schema";
import type { ToolDefinition } from "../models/deepseek";
import { logLine } from "../utils/logger";
import { fetchYattaItems } from "./yatta";

export const definition: ToolDefinition = {
  type: "function",
  function: {
    name: "get_yatta",
    description: "只补本地没查到的那一项。get_character 返回没有找到，或 get_weapon、get_artifact 返回的列表为空时，才可以调用。本地已经返回了角色资料或推荐名字时不要调用。返回只用于补缺的那一项，不要覆盖其他项。参数 name 是角色中文名。",
    parameters: {
      type: "object",
      properties: { name: { type: "string", description: "要查询的中文名" } },
      required: ["name"],
    },
  },
};

export async function run(args: { name: string }) {
  logLine(`查询 yatta --- ${args.name}`);
  const avatars = await fetchYattaItems("avatar");
  const avatar = avatars.find((item) => item.name === args.name);
  if (avatar && avatar.rank != null && avatar.element && avatar.weaponType) {
    db.insert(characters).values({
      name: avatar.name,
      rank: avatar.rank,
      element: avatar.element,
      weaponType: avatar.weaponType,
    }).onConflictDoNothing().run();
    return { kind: "character", name: avatar.name, rank: avatar.rank, element: avatar.element, weaponType: avatar.weaponType };
  }

  const weaponItems = await fetchYattaItems("weapon");
  const weapon = weaponItems.find((item) => item.name === args.name);
  if (weapon && weapon.rank != null && weapon.type) {
    db.insert(weapons).values({ name: weapon.name, rank: weapon.rank, type: weapon.type }).onConflictDoNothing().run();
    return { kind: "weapon", name: weapon.name, rank: weapon.rank, type: weapon.type };
  }

  const sets = await fetchYattaItems("reliquary");
  const set = sets.find((item) => item.name === args.name);
  if (set?.affixList) {
    const effects = Object.values(set.affixList);
    db.insert(artifacts).values({ name: set.name, effects: JSON.stringify(effects) }).onConflictDoNothing().run();
    return { kind: "artifact", name: set.name, effects };
  }

  return { error: `yatta 没有找到：${args.name}` };
}
