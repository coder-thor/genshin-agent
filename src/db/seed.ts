import { db } from "./index";
import { characters, weaponRecommendations, weapons } from "./schema";

const character = {
  name: "米提亚",
  rank: 5,
  element: "Electric",
  weaponType: "WEAPON_CATALYST",
};

// 100 多个橘色都放到数组

const weaponRows = [
  { name: "神乐之真意", rank: 5, type: "WEAPON_CATALYST" },
  { name: "天空之卷", rank: 5, type: "WEAPON_CATALYST" },
];

export function seed() {
  // 往角色表插入数据
  // 如果有冲突就不做任何事情
  db.insert(characters).values(character).onConflictDoNothing().run();
  for (const weapon of weaponRows) {
    // 将武器以及推荐武器都注入到对应数据库里
    db.insert(weapons).values(weapon).onConflictDoNothing().run();
    // 这个地方做的最好的情况是做外键关联
    // 一个角色也会有多个推荐武器
    db.insert(weaponRecommendations).values({
      characterName: character.name,
      weaponName: weapon.name,
    }).onConflictDoNothing().run();
  }
}
