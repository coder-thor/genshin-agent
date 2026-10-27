import type { Message } from "../models/deepseek";

// 所有记忆实现都提供这两个方法，agents 只认这个接口
export interface Memory {
  add(msg: Message): void;
  get(): Message[];
}
