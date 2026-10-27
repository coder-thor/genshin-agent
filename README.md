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
├── index.ts                # 入口：读取输入、打印回答
├── agents/                 # 回答方式
│   ├── chat.ts             #   普通对话：调一次模型就结束
│   └── tool-agent.ts       #   Agent：模型要用工具就执行，直到它直接回答
├── memory/                 # 对话记忆
│   ├── types.ts            #   记忆的统一接口
│   ├── full-history.ts     #   整轮对话都发给模型
│   └── no-history.ts       #   只发当前这一句
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

同一个目录下的几种实现用法完全一样，在 `src/index.ts` 里改 import 就能切换：

- `agents/chat` ↔ `agents/tool-agent`：要不要工具
- `memory/no-history` ↔ `memory/full-history`：要不要记住之前的对话

新加工具：在 `tools/` 里加一个文件，导出 `definition` 和 `run`，再登记到 `tools/index.ts`。
