import { callModel, type Message } from "../models/deepseek";
import { SYSTEM_PROMPT } from "../prompts/system";

export async function reply(question: string, histories: Message[]) {
  const messages: Message[] = [
    { role: "system", content: SYSTEM_PROMPT }, // 系统提示词
    ...histories,
  ];

  // 数组里永远只有 2 项对吧
  // 如果你想要他有记忆功能， 你应该怎么做？
  // 是不是需要把之前所有的历史记录信息 加上本次的问题 重新打包成一个新的 content 发给 llm
  const answer = await callModel(messages);
  return answer.content ?? "";
}
