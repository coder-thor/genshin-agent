import type { ToolDefinition } from "../models/deepseek";

// 告诉模型这个工具：叫什么、能干什么、要传什么参数
export const definition: ToolDefinition = {
  type: "function",
  function: {
    name: "get_character",
    description: "查询原神角色的基础资料：星级、元素、武器类型。",
    parameters: {
      type: "object",
      properties: { name: { type: "string", description: "角色的中文名，比如“胡桃”" } },
      required: ["name"],
    },
  },
};

// 从社区整理的原神数据里，按名字查角色的星级、元素、武器
export async function run(args: { name: string }) { // name: 薇斯纳
  const resp = await fetch("https://gi.yatta.moe/api/v2/chs/avatar"); // 返回所有的角色
  const data = await resp.json();
  // 从所有角色里找看看有没有参数 name 的角色
  const found: any = Object.values(data.data.items).find((c: any) => c.name === args.name);
  if (!found) return { error: `没有找到角色：${args.name}` };
  return { name: found.name, rarity: found.rank, element: found.element, weapon: found.weaponType };
}
