import OpenAI from "openai";
import { log } from "../utils/logger";
import { RunnableToolFunctionWithParse } from "openai/lib/RunnableFunction.mjs";

declare module "openai/resources/chat/completions/completions" {
  interface ChatCompletionCreateParamsBase {
    thinking?: { type: "enabled" | "disabled" };
  }
}




export type Message = OpenAI.Chat.ChatCompletionMessageParam;
export type ToolDefinition = OpenAI.Chat.ChatCompletionFunctionTool;

// deepseek 为什么是 openai?  openai定义了一套 llm 的交互标准 然后 deepseek实现了这套标准
const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com", // 是 deepseek 的地址
});

export async function callModel(messages: Message[], tools?: ToolDefinition[]) {
  const request = {
    model: "deepseek-flash", //调用的 llm 模型
    messages, // 刚刚那个数组 [{role: system, content: 提示词}, { role: user, content: 钟离的圣遗物搭配 }]
    tools,
    thinking: { type: "disabled" as const },
    stream: true as const,
    stream_options: { include_usage: true } // 在流式模式下统计对应的 token
  };
  log("请求", request);
  
  // 就是在和 deepseek的 llm 交互
  const stream = await client.chat.completions.create(request); // 一条流 我们需要不断的去监听这个流送过来的内容块


  // 在单个请求中的变量存储信息
  // 钟 离 虽然说我们可以一个字一个字的这样打在公屏， 但是最终进历史记录的时候是不是应该要是一句话对不对
  let currentFullContent = "" // 代表本次请求的 message 内容
  const currentFullToolsCall: {id: string; name: string; args: string}[] = []

  for await (const streamContent of stream) {
    // token 的使用只在最后一块到来的时候有值
    if (streamContent.usage) {
      console.log(`输出了${streamContent.usage.completion_tokens}, 输入了${streamContent.usage.prompt_tokens}个 token`)
    }
    const currentDelta = streamContent.choices[0].delta
    if (currentDelta) {
      currentFullContent += currentDelta
      if (currentDelta.content) { // content必须有值， 没值的话就可能是 tool/call
        process.stdout.write(currentDelta.content )
      }
    }

    // 我们还要考虑一个事情 就是 tools/call llm会指定调用某个 tool
    const toolsCallList = currentDelta.tool_calls || []
    for (const toolcall of toolsCallList) {
      // get_characters get_char index 这个 index 表示是调用的哪个 tool
      if (currentFullToolsCall[toolcall.index]) { // 代表你不是第一块 get  _
        // 代表这一块已经在 toolcall 列表里存过了
        log("tools/call 参数", toolcall.function)
        if (toolcall.id) currentFullToolsCall[toolcall.index].id += toolcall.id
        if (toolcall.function?.name) currentFullToolsCall[toolcall.index].name += toolcall.function.name
        if (toolcall.function?.arguments) currentFullToolsCall[toolcall.index].args += toolcall.function.arguments

      } else {
          log("tools/call 参数", toolcall.function?.name || "") // name只会在第一进来的时候全量打印
        //如果是第一次遇到这一块呢？
        currentFullToolsCall[toolcall.index] = {
          id: "",
          name: "",
          args: ""
        }
        // 代码冗余稍后优化
        if (toolcall.id) currentFullToolsCall[toolcall.index].id += toolcall.id
        if (toolcall.function?.name) currentFullToolsCall[toolcall.index].name += toolcall.function.name
        if (toolcall.function?.arguments) currentFullToolsCall[toolcall.index].args += toolcall.function.arguments
      }
    }

    // 拿到了完整 content 和完整 toolscalllist
  }

  // 返回的时候就要拼好整个结果对象
  const message = {
    role: "assistant" as const,
    content: currentFullContent || null,
    tool_calls: currentFullToolsCall.length ? currentFullToolsCall.map(cft => ({
      id: cft.id,
      type: "function" as const,
      function: { name: cft.name, arguments: cft.args }
    })) : undefined,
  }
  log("返回", message)
  return message
}



export async function callModelByRunTools(
  messages: Message[],
  tools: RunnableToolFunctionWithParse<any>[],
) {
  // runtools可以做到当 llm指定对应的 tool 执行时 帮你自动调用对应的 tool
  const runner = client.chat.completions.runTools({
    model: "deepseek-flash",
    messages,
    tools,
    thinking: { type: "disabled" },
  });

  const message = await runner.finalMessage(); // 拿到最终的调用结果 -- llm 的最终回复
  const usage = await runner.totalUsage(); // 统计最终的 token 使用情况
  console.log(`[输入 ${usage.prompt_tokens} 个 token · 输出 ${usage.completion_tokens} 个 token]`);
  return message;
}