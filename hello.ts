import { client } from "./deepseek";

const resp = await client.chat.completions.create({
  model: "deepseek-flash",
  messages: [
    { role: "system", content: "你是一个原神助手，每次回答不超过两句话。" },
    { role: "user", content: "用一句话介绍一下你自己。" },
  ],
  // 思考模式默认开启，这节课先关掉
  thinking: { type: "disabled" },
});

console.log(resp.choices[0].message.content);
