import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

import { userService } from "./services";

export const AUTH_SESSION_COOKIE = "chai_session";

function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;

  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }

  return null;
}

export async function createContext(opts: CreateExpressContextOptions) {
  const sessionToken = readCookie(opts.req.headers.cookie, AUTH_SESSION_COOKIE);
  const user = sessionToken ? await userService.getSessionUser(sessionToken) : null;

  return {
    req: opts.req,
    res: opts.res,
    sessionToken,
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
