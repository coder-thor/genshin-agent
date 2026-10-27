import * as getCharacter from "./get-character";

// 新加工具：在 tools/ 里加一个文件，再登记到这里
const allTools = [getCharacter];

// 发给模型看的工具说明
export const tools = allTools.map((t) => t.definition);

// 模型说要调哪个工具，程序就去执行哪个
export async function runTool(name: string, args: any) {
  const tool = allTools.find((t) => t.definition.function.name === name);
  if (!tool) return { error: `没有这个工具：${name}` };
  return tool.run(args);
}
