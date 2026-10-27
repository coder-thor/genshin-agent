# genshin-agent

Agent 开发课程基础篇 Demo：原神小助手。

课程视频：[Bilibili](https://www.bilibili.com/video/BV1MGnB63Eib/)

## 准备

1. 安装 [Bun](https://bun.sh)。
2. 安装依赖：

   ```bash
   bun install
   ```

3. 复制 `.env.example` 为 `.env`，填入你的 DeepSeek API Key。

## 运行

在项目根目录执行：

```bash
bun start
```

在终端里输入问题，输入 `exit` 退出。每一轮的用户输入、发给模型的完整请求、模型的完整返回、工具调用和最终回答，都会追加到项目根目录的 `log.txt`。

## 目录结构

```
src/
├── index.ts                # 入口：读取输入、打印回答
├── agents/                 # 回答方式
│   ├── chat.ts             #   普通对话：调一次模型就结束
│   └── tool-agent.ts       #   Agent：模型要用工具就执行，直到它直接回答
├── memory/                 # 对话记忆
│   └── full-history.ts     #   用一个数组存下所有对话
├── models/
│   └── deepseek.ts         # 模型客户端：调用 DeepSeek，记录日志和 token 用量
├── prompts/
│   └── system.ts           # 系统提示词
├── tools/
│   ├── index.ts            # 工具注册：汇总所有工具，按名字执行
│   └── get-character.ts    # 查角色资料
└── utils/
    └── logger.ts           # 写 log.txt
```

`agents/chat` 和 `agents/tool-agent` 用法一样，在 `src/index.ts` 里改 import 就能切换要不要工具。

新加工具：在 `tools/` 里加一个文件，导出 `definition` 和 `run`，再登记到 `tools/index.ts`。
