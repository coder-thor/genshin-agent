# genshin-agent

原神助手：在终端里和 DeepSeek 对话，能记住上下文，能自己调用工具查角色资料。

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

在终端里输入问题，输入 `exit` 退出。每次发给模型的完整请求和返回，都会追加到根目录的 `log.txt`。

## 目录结构

```
src/
├── index.ts       # 入口：读取输入、打印回答
├── llm.ts         # 模型客户端：调用 DeepSeek，记录日志和 token 用量
├── prompts.ts     # 系统提示词
├── memory.ts      # 有记忆：整轮对话都发给模型
├── no-memory.ts   # 没记忆：只发当前这一句
├── chat.ts        # 普通对话：调一次模型就结束
├── agent.ts       # Agent：模型要用工具就执行，直到它直接回答
├── tools.ts       # 工具：查角色资料
└── logger.ts      # 写 log.txt
```

`memory.ts` 和 `no-memory.ts`、`chat.ts` 和 `agent.ts` 用法完全一样，在 `src/index.ts` 里改 import 就能切换。
