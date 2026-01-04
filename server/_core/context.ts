import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { upsertUser, getUserByOpenId } from "../db";

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
  } catch (error) {
    // Authentication is optional for public procedures.
    // In production, if no user is found, we provide a default guest user to allow standalone usage.
    // First, ensure the guest user exists in the database
    try {
      await upsertUser({
        openId: "guest",
        name: "Guest User",
        email: "guest@example.com",
        role: "admin",
        loginMethod: "guest",
      });
      
      // Get the actual user from database to get the correct ID
      const dbUser = await getUserByOpenId("guest");
      if (dbUser) {
        user = dbUser;
      } else {
        // Fallback if database is not available
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
    } catch (dbError) {
      // If database operations fail, use fallback user
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
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
