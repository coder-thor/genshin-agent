import readline from "node:readline/promises";

const base = "http://127.0.0.1:3000";

async function login(userId: string) {
  const resp = await fetch(`${base}/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  const data = (await resp.json()) as { token: string };
  return data.token;
}

function parseSse(block: string) {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).replace(/^ /, "");
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).replace(/^ /, ""));
  }
  if (!dataLines.length) return null;
  return { event, data: JSON.parse(dataLines.join("\n")) as { sessionId?: string; text?: string; message?: string } };
}

async function sessions(token: string) {
  const resp = await fetch(`${base}/sessions`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(await resp.text());
  const data = (await resp.json()) as { sessions: { id: string; preview: string }[] };
  return data.sessions;
}

async function say(token: string, text: string, sessionId?: string) {
  const path = sessionId ? `/sessions/${sessionId}/messages` : "/messages";
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
  let current = sessionId;
  let started = false;
  const writeToken = (chunk: string) => {
    if (!started) {
      process.stdout.write("助手：");
      started = true;
    }
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
      if (parsed?.event === "session" && parsed.data.sessionId) {
        if (!current) console.log(`[会话 ${parsed.data.sessionId}]`);
        current = parsed.data.sessionId;
      } else if (parsed?.event === "token" && parsed.data.text) {
        writeToken(parsed.data.text);
      } else if (parsed?.event === "done") {
        process.stdout.write("\n");
      } else if (parsed?.event === "error") {
        process.stdout.write(`\n[错误] ${parsed.data.message ?? ""}\n`);
      }
      split = buf.indexOf("\n\n");
    }
  }
  return current;
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const userId = await rl.question("用户：");
const token = await login(userId);
console.log("已登录。直接说话会新建会话。/sessions 看已有会话，/use 会话id 接上，/new 换一个，exit 退出。");

let sessionId: string | undefined;
while (true) {
  const input = await rl.question("\n你：");
  if (input === "exit") break;
  if (input === "/new") {
    sessionId = undefined;
    console.log("下一条消息会新开一个会话");
    continue;
  }
  if (input === "/sessions") {
    const items = await sessions(token);
    if (!items.length) console.log("还没有会话");
    for (const item of items) console.log(`${item.id}  ${item.preview}`);
    continue;
  }
  if (input.startsWith("/use ")) {
    const id = input.slice("/use ".length);
    const items = await sessions(token);
    if (!items.some((item) => item.id === id)) {
      console.log("没有这个会话");
      continue;
    }
    sessionId = id;
    console.log(`已接上会话 ${id}`);
    continue;
  }
  sessionId = await say(token, input, sessionId);
}
rl.close();
