import readline from "node:readline/promises";

const base = "http://127.0.0.1:3000";

const authHints: Record<string, string> = {
  PASSWORD_TOO_SHORT: "密码太短，至少 8 位",
  PASSWORD_TOO_LONG: "密码太长",
  INVALID_EMAIL: "邮箱格式不对",
  USER_ALREADY_EXISTS: "这个邮箱已经注册过了",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "这个邮箱已经注册过了",
  INVALID_EMAIL_OR_PASSWORD: "邮箱或密码不对",
};

async function authCall(path: string, body: Record<string, string>) {
  const resp = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const token = resp.headers.get("set-auth-token");
  if (resp.ok && token) return token;
  const text = await resp.text();
  let hint = "登录没有成功";
  try {
    const payload = JSON.parse(text) as { code?: string; message?: string };
    if (payload.code && authHints[payload.code]) hint = authHints[payload.code];
    else if (payload.message) hint = payload.message;
  } catch {
    if (text) hint = text;
  }
  console.log(hint);
  return null;
}

function parseSse(block: string) {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).replace(/^ /, "");
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).replace(/^ /, ""));
  }
  if (!dataLines.length) return null;
  return { event, data: JSON.parse(dataLines.join("\n")) as { chatId?: string; text?: string; message?: string } };
}

async function chats(token: string) {
  const resp = await fetch(`${base}/chats`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(await resp.text());
  const data = (await resp.json()) as { chats: { id: string; preview: string }[] };
  return data.chats;
}

function startThinking() {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  process.stdout.write(`${frames[0]} thinking`);
  const timer = setInterval(() => {
    i += 1;
    process.stdout.write(`\r${frames[i % frames.length]} thinking`);
  }, 80);
  return () => {
    clearInterval(timer);
    process.stdout.write("\r\x1b[2K");
  };
}

async function say(token: string, text: string, chatId?: string) {
  const path = chatId ? `/chats/${chatId}/messages` : "/messages";
  const resp = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  if (!resp.ok || !resp.body) throw new Error(await resp.text());

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let current = chatId;
  let started = false;
  let stopThinking = startThinking();
  const beginAnswer = () => {
    if (started) return;
    stopThinking();
    stopThinking = () => {};
    process.stdout.write("助手：");
    started = true;
  };
  const writeToken = (chunk: string) => {
    beginAnswer();
    process.stdout.write(chunk);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let split = buf.indexOf("\n\n");
    while (split >= 0) {
      const parsed = parseSse(buf.slice(0, split));
      buf = buf.slice(split + 2);
      if (parsed?.event === "chat" && parsed.data.chatId) {
        if (!current) {
          stopThinking();
          console.log(`[聊天 ${parsed.data.chatId}]`);
          stopThinking = startThinking();
        }
        current = parsed.data.chatId;
      } else if (parsed?.event === "summarize") {
        stopThinking();
        process.stdout.write(`${parsed.data.text ?? "context summarized"}\n`);
        if (!started) stopThinking = startThinking();
      } else if (parsed?.event === "token" && parsed.data.text) {
        writeToken(parsed.data.text);
      } else if (parsed?.event === "done") {
        if (!started && parsed.data.text) writeToken(parsed.data.text);
        stopThinking();
        process.stdout.write("\n");
      } else if (parsed?.event === "error") {
        stopThinking();
        process.stdout.write(`\n[错误] ${parsed.data.message ?? ""}\n`);
      }
      split = buf.indexOf("\n\n");
    }
  }
  stopThinking();
  return current;
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let token: string | null = null;
while (!token) {
  let mode = "";
  while (mode !== "login" && mode !== "register") {
    mode = await rl.question("login / register: ");
  }
  if (mode === "register") {
    const name = await rl.question("name: ");
    const email = await rl.question("email: ");
    const password = await rl.question("password: ");
    token = await authCall("/api/auth/sign-up/email", { name, email, password });
  } else {
    const email = await rl.question("email: ");
    const password = await rl.question("password: ");
    token = await authCall("/api/auth/sign-in/email", { email, password });
  }
}
console.log("已登录。直接说话会新建聊天。/chats 看已有聊天，/use 聊天id 接上，/new 换一个，exit 退出。");

let chatId: string | undefined;
while (true) {
  const input = await rl.question("\n你：");
  if (input === "exit") break;
  if (input === "/new") {
    chatId = undefined;
    console.log("下一条消息会新开一个聊天");
    continue;
  }
  if (input === "/chats") {
    const items = await chats(token);
    if (!items.length) console.log("还没有聊天");
    for (const item of items) console.log(`${item.id}  ${item.preview}`);
    continue;
  }
  if (input.startsWith("/use ")) {
    const id = input.slice("/use ".length);
    const items = await chats(token);
    if (!items.some((item) => item.id === id)) {
      console.log("没有这个聊天");
      continue;
    }
    chatId = id;
    console.log(`已接上聊天 ${id}`);
    continue;
  }
  chatId = await say(token, input, chatId);
}
rl.close();
