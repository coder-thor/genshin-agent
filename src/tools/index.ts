import * as getCharacter from "./get-character";

const allTools = [getCharacter];

export const tools = allTools.map((t) => t.definition);

export async function  runTool(name: string, args: any) {
  const tool = allTools.find((t) => t.definition.function.name === name);
  if (!tool) return { error: `没有这个工具：${name}` };
  return tool.run(args);
}
