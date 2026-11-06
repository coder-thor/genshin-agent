import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { bearer } from "better-auth/plugins";
import { db } from "../db";
import { schema } from "../db/schema";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) throw new Error("缺少 BETTER_AUTH_SECRET");

export const auth = betterAuth({
  secret,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:3000",
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  emailAndPassword: { enabled: true },
  plugins: [bearer()],
  databaseHooks: {
    session: {
      create: {
        after: async (row) => {
          console.log(`用户 ${row.userId} 登录`);
        },
      },
    },
  },
});
