import * as getArtifact from "./get-artifact";
import * as getCharacter from "./get-character";
import * as getWeapon from "./get-weapon";
import * as getYatta from "./get-yatta";

const allTools = [getCharacter, getWeapon, getArtifact, getYatta];

export const tools = allTools.map((tool) => tool.definition);

export async function runTool(name: string, args: { name: string }) {
  const tool = allTools.find((item) => item.definition.function.name === name);
  if (!tool) return { error: `没有这个工具：${name}` };
  return tool.run(args);
}
