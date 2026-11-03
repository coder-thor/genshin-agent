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


export const runnableTools = allTools.map((t) => {
  const { name, description, parameters } = t.definition.function;
  if (description === undefined || parameters === undefined) {
    throw new Error(`${name} 缺少 description 或 parameters`);
  }

  return {
    type: "function" as const,
    function: {
      name,
      description,
      parameters,
      parse: (raw: string) => JSON.parse(raw), // parse 用于告诉openaisdk 怎么去解析 llm 传过来的参数 "{"name": "薇斯纳"}""
      function: (args: any) => t.run(args), // 告诉 openai sdk 怎么调用对应的 tool
    },
  };
});

