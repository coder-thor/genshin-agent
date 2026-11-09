// gi.yatta.moe 的角色、武器、圣遗物目录。本地表没有时才请求。
type YattaItem = {
  name: string;
  rank?: number;
  element?: string;
  weaponType?: string;
  type?: string;
  affixList?: Record<string, string>;
};

export async function fetchYattaItems(kind: "avatar" | "weapon" | "reliquary") {
  const resp = await fetch(`https://gi.yatta.moe/api/v2/chs/${kind}`);
  if (!resp.ok) throw new Error(`yatta ${kind} ${resp.status}`);
  const body = await resp.json() as { data: { items: Record<string, YattaItem> } };
  return Object.values(body.data.items);
}
