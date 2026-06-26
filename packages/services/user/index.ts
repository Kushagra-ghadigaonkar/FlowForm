import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { db, eq, and, gt } from "@repo/database";
import { userSessionsTable, usersTable } from "@repo/database/schema";
import { env } from "../env";
import { googleOAuth2Client } from "../clients/google-oauth";
import {
  AuthSession,
  AuthUser,
  GetAuthenticationMethodOutputSchema,
  loginInputSchema,
  registerInputSchema,
} from "./model";

const SESSION_DAYS = 30;
const DEMO_EMAIL = "judge@flowform.io";
const LEGACY_DEMO_EMAIL = "judge@chaiforms.io";
const DEMO_PASSWORD = "spider-sense-2026";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) return false;

  const [algorithm, salt, hash] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function toAuthUser(user: typeof usersTable.$inferSelect): AuthUser {
  const isLegacyDemo = user.email === LEGACY_DEMO_EMAIL;
  return {
    id: user.id,
    fullName: isLegacyDemo ? "FlowForm Judge" : user.fullName,
    email: isLegacyDemo ? DEMO_EMAIL : user.email,
    profileImageUrl: user.profileImageUrl ?? null,
  };
}

async function ensureDemoUser(): Promise<void> {
  const [existingUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, DEMO_EMAIL))
    .limit(1);

  if (existingUser) return;

  const [legacyUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, LEGACY_DEMO_EMAIL))
    .limit(1);

  if (legacyUser) {
    await db
      .update(usersTable)
      .set({ fullName: "FlowForm Judge", email: DEMO_EMAIL })
      .where(eq(usersTable.id, legacyUser.id));
    return;
  }

  await db.insert(usersTable).values({
    fullName: "FlowForm Judge",
    email: DEMO_EMAIL,
    emailVerified: true,
    passwordHash: hashPassword(DEMO_PASSWORD),
  });
}

class UserService {
  public async getAuthenticationMethods(): Promise<
    ReadonlyArray<GetAuthenticationMethodOutputSchema>
  > {
    const supportedAuthenticationProviders: GetAuthenticationMethodOutputSchema[] = [];

    const isGoogleConfigured = !!(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET);

    if (isGoogleConfigured) {
      const url = googleOAuth2Client.generateAuthUrl();
      supportedAuthenticationProviders.push({
        provider: "GOOGLE_OAUTH",
        displayName: "Google",
        displayText: "Signin with Google",
        authUrl: url,
      });
    }

    return supportedAuthenticationProviders;
  }

  public async register(input: unknown): Promise<AuthSession> {
    const parsed = registerInputSchema.parse(input);
    const email = normalizeEmail(parsed.email);

    const [existingUser] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existingUser) throw new Error("A user with this email already exists");

    const [user] = await db
      .insert(usersTable)
      .values({
        fullName: parsed.fullName,
        email,
        passwordHash: hashPassword(parsed.password),
      })
      .returning();

    if (!user) throw new Error("Unable to create account");

    return this.createSession(toAuthUser(user));
  }

  public async login(input: unknown): Promise<AuthSession> {
    const parsed = loginInputSchema.parse(input);
    const email = normalizeEmail(parsed.email);
    const isDemoLogin = email === DEMO_EMAIL || email === LEGACY_DEMO_EMAIL;

    if (isDemoLogin) await ensureDemoUser();

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, isDemoLogin ? DEMO_EMAIL : email))
      .limit(1);

    if (!user || !verifyPassword(parsed.password, user.passwordHash)) {
      throw new Error("Invalid email or password");
    }

    return this.createSession(toAuthUser(user));
  }

  public async getSessionUser(sessionToken: string): Promise<AuthUser | null> {
    const tokenHash = hashSessionToken(sessionToken);
    const [session] = await db
      .select()
      .from(userSessionsTable)
      .where(
        and(eq(userSessionsTable.tokenHash, tokenHash), gt(userSessionsTable.expiresAt, new Date())),
      )
      .limit(1);

    if (!session) return null;

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, session.userId))
      .limit(1);

    return user ? toAuthUser(user) : null;
  }

  public async logout(sessionToken: string): Promise<void> {
    await db
      .delete(userSessionsTable)
      .where(eq(userSessionsTable.tokenHash, hashSessionToken(sessionToken)));
  }

  private async createSession(user: AuthUser): Promise<AuthSession> {
    const sessionToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

    await db.insert(userSessionsTable).values({
      userId: user.id,
      tokenHash: hashSessionToken(sessionToken),
      expiresAt,
    });

    return {
      user,
      sessionToken,
      expiresAt,
    };
  }
}

export default UserService;
