import type { Message } from "../models/deepseek";

const history: Message[] = [];

export const memory = {
  load: () => history,
  // save api专门保存 message 信息
  save: (msg: Message) => {
    history.push(msg);
  },
};
