import { client } from "./deepseek";

for (const maxTokens of [20, 2000]) {
  const resp = await client.chat.completions.create({
    model: "deepseek-flash",
    messages: [{ role: "user", content: "介绍一下原神里蒙德城有哪些值得逛的地方。" }],
    max_tokens: maxTokens,
    thinking: { type: "disabled" },
  });
  const choice = resp.choices[0];
  console.log(`=== max_tokens=${maxTokens} ===`);
  console.log(choice.message.content);
  console.log("停止原因：", choice.finish_reason, "· 输出", resp.usage!.completion_tokens, "个 token\n");
}
