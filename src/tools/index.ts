import * as getCharacter from "./get-character";

const allTools = [getCharacter]; // 所有的工具里就有一个 function 是去原神社区找到所有的角色， 然后通过你传给他的 name 字段去找有没有对应的角色

export const tools = allTools.map((t) => t.definition);

export async function  runTool(name: string, args: any) {
  // name               "name": "get_character",
              // "arguments": "{\"name\": \"薇斯纳\"}"
  const tool = allTools.find((t) => t.definition.function.name === name);
  if (!tool) return { error: `没有这个工具：${name}` };
  return tool.run(args);
}
