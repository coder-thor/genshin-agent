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

服务端：

```bash
bun start
```

客户端另开一个终端：

```bash
bun run client
```

发给模型的请求、返回和工具调用会追加到项目根目录的 `log.txt`。

## 手稿

第 1 节到目前最新一节的 Excalidraw 手稿在仓库根目录的 `drawings/`。

第 1 到第 5 节，以及生产缺口那一份，来自 Obsidian 库 `orbitproxy/Excalidraw`。最后一份服务端和客户端手稿在课程目录 `drafts/genshin-gap/server-client.excalidraw`。

| 文件 | 来源 | 内容 |
|---|---|---|
| `drawings/lesson-1.excalidraw` | `agent-dev-lesson-1.excalidraw` | 第 1 节 |
| `drawings/lesson-2.excalidraw` | `agent-dev-lesson-2.excalidraw` | 第 2 节 |
| `drawings/lesson-3.excalidraw` | `agent-dev-lesson-3.excalidraw` | 第 3 节。这一节只画了开场的「01 课程目标」 |
| `drawings/lesson-4.excalidraw` | `agent-dev-lesson-4 5.excalidraw` | 第 4 节 |
| `drawings/lesson-5.excalidraw` | `agent-dev-lesson-5 3.excalidraw` | 第 5 节 |
| `drawings/genshin-agent-gap.excalidraw` | `genshin-agent-gap 12.excalidraw` | 离生产闭环还差什么 |
| `drawings/server-client.excalidraw` | `drafts/genshin-gap/server-client.excalidraw` | 目前最新一节：服务端和客户端。两种架构、SSE、一次对话怎么走、每个文件做什么 |

用 VS Code 的 Excalidraw 插件打开，步骤和截图见 [drawings/README.md](drawings/README.md)。

## 目录结构

```
src/
├── index.ts                # 启动 HTTP 服务
├── client.ts               # 测试客户端：登录、发消息
├── http/                   # 路由、JSON、SSE
├── auth/                   # 登录和 token
├── sessions/               # 用户、会话、消息，以及一轮对话
├── agents/                 # 回答方式
│   ├── chat.ts             #   普通对话：调一次模型就结束
│   └── tool-agent.ts       #   Agent：模型要用工具就执行，直到它直接回答
├── models/
│   └── deepseek.ts         # 模型客户端：调用 DeepSeek
├── prompts/
│   └── system.ts           # 系统提示词
├── tools/
│   ├── index.ts            # 工具注册：汇总所有工具，按名字执行
│   └── get-character.ts    # 查角色资料
└── utils/
    └── logger.ts           # 写 log.txt
```

新加工具：在 `tools/` 里加一个文件，导出 `definition` 和 `run`，再登记到 `tools/index.ts`。
