import { z, zodEmptyInputModel, zodUndefinedModel } from "../../schema";
import { userService } from "../../services";
import {
  authUserSchema,
  getAuthenticationMethodOutputSchema,
  loginInputSchema,
  registerInputSchema,
} from "@repo/services/user/model";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { AUTH_SESSION_COOKIE, type Context } from "../../context";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

function serializeCookie(name: string, value: string, maxAge: number) {
  const nodeEnv = process.env.NODE_ENV as string | undefined;
  const isProduction = nodeEnv === "production" || nodeEnv === "prod";
  const secure = isProduction ? "; Secure" : "";
  const sameSite = isProduction ? "None" : "Lax";
  return `${name}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=${sameSite}; Max-Age=${maxAge}${secure}`;
}

function setSessionCookie(ctx: Context, sessionToken: string, expiresAt: Date) {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  ctx.res.setHeader("Set-Cookie", serializeCookie(AUTH_SESSION_COOKIE, sessionToken, maxAge));
}

function clearSessionCookie(ctx: Context) {
  ctx.res.setHeader("Set-Cookie", serializeCookie(AUTH_SESSION_COOKIE, "", 0));
}

export const authRouter = router({
  getSupportedAuthenticationProviders: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/supported-providers"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.readonly(z.array(getAuthenticationMethodOutputSchema)))
    .query(async () => {
      const supportedMethods = await userService.getAuthenticationMethods();
      return supportedMethods;
    }),

  me: publicProcedure
    .input(zodEmptyInputModel)
    .output(authUserSchema.nullable())
    .query(({ ctx }) => ctx.user),

  register: publicProcedure
    .input(registerInputSchema)
    .output(authUserSchema)
    .mutation(async ({ ctx, input }) => {
      const session = await userService.register(input);
      setSessionCookie(ctx, session.sessionToken, session.expiresAt);
      return session.user;
    }),

  login: publicProcedure
    .input(loginInputSchema)
    .output(authUserSchema)
    .mutation(async ({ ctx, input }) => {
      const session = await userService.login(input);
      setSessionCookie(ctx, session.sessionToken, session.expiresAt);
      return session.user;
    }),

  logout: protectedProcedure
    .input(zodEmptyInputModel)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx }) => {
      if (ctx.sessionToken) await userService.logout(ctx.sessionToken);
      clearSessionCookie(ctx);
      return { success: true };
    }),
});
