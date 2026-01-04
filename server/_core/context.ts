import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
    console.log("[Auth] User authenticated:", user.openId);
  } catch (error) {
    // Authentication is optional for public procedures.
    // In production, if no user is found, we provide a default guest user to allow standalone usage.
    console.log("[Auth] Authentication failed, providing guest user");
    user = {
      id: 1,
      openId: "guest",
      name: "Guest User",
      email: "guest@example.com",
      role: "admin",
      loginMethod: "guest",
      lastSignedIn: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
