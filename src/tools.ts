import type { Tool } from "./llm";

// 从社区整理的原神数据里，按名字查角色的星级、元素、武器
async function getCharacter(name: string) {
  const resp = await fetch("https://gi.yatta.moe/api/v2/chs/avatar");
  const data = await resp.json();
  const found: any = Object.values(data.data.items).find((c: any) => c.name === name);
  if (!found) return { error: `没有找到角色：${name}` };
  return { name: found.name, rarity: found.rank, element: found.element, weapon: found.weaponType };
}

// 告诉模型有哪些工具：叫什么、能干什么、要传什么参数
export const tools: Tool[] = [
  {
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
  },
];

// 模型说要调哪个工具，程序就去执行哪个
export async function runTool(name: string, args: any) {
  if (name === "get_character") return getCharacter(args.name);
  return { error: `没有这个工具：${name}` };
}
