import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { clientIp, deviceSignatureFrom } from "@/lib/device";
import {
  evaluateLock,
  MAX_FAILED_PER_IP,
  WINDOW_MINUTES,
} from "@/lib/rate-limit";
import type { AppRole } from "@/types/next-auth";

export class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

const DUMMY_HASH = bcrypt.hashSync("tidak-dipakai-sebagai-password", 10);

const credentialsSchema = z.object({
  identifier: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(128),
});

type Kind = "PEGAWAI" | "ADMIN";

async function authenticate(kind: Kind, raw: unknown, request: Request) {
  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { identifier, password } = parsed.data;
  const deviceSignature = deviceSignatureFrom(request.headers);
  const ip = clientIp(request.headers);
  const now = new Date();
  const since = new Date(now.getTime() - WINDOW_MINUTES * 60_000);

  const failures = await db.loginAttempt.findMany({
    where: {
      kind,
      identifier,
      success: false,
      createdAt: { gt: new Date(now.getTime() - WINDOW_MINUTES * 60_000) },
    },
    select: { createdAt: true },
  });
  if (
    evaluateLock(
      failures.map((f) => f.createdAt),
      now,
    ).locked
  ) {
    throw new RateLimitedError();
  }

  if (ip) {
    const ipFailures = await db.loginAttempt.findMany({
      where: { ip, success: false, createdAt: { gt: since } },
      select: { createdAt: true },
    });
    if (
      evaluateLock(
        ipFailures.map((f) => f.createdAt),
        now,
        MAX_FAILED_PER_IP,
      ).locked
    ) {
      throw new RateLimitedError();
    }
  }

  const account =
    kind === "PEGAWAI"
      ? await db.user.findUnique({ where: { nip: identifier } })
      : await db.admin.findUnique({ where: { username: identifier } });

  const passwordOk = await bcrypt.compare(
    password,
    account?.passwordHash ?? DUMMY_HASH,
  );
  const success = Boolean(account && account.isActive && passwordOk);

  if (success) {
    await db.loginAttempt.deleteMany({
      where: { kind, identifier, success: false },
    });
  }
  await db.loginAttempt.create({
    data: { kind, identifier, success, deviceSignature, ip },
  });

  if (!success || !account) return null;
  return {
    id: account.id,
    name: account.name,
    role: kind as AppRole,
    mustChangePassword: account.mustChangePassword,
  };
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "pegawai",
      credentials: { identifier: {}, password: {} },
      authorize: (raw, request) => authenticate("PEGAWAI", raw, request),
    }),
    Credentials({
      id: "admin",
      credentials: { identifier: {}, password: {} },
      authorize: (raw, request) => authenticate("ADMIN", raw, request),
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
      }
      if (trigger === "update") {
        const fresh =
          token.role === "ADMIN"
            ? await db.admin.findUnique({ where: { id: token.id } })
            : await db.user.findUnique({ where: { id: token.id } });
        if (fresh) token.mustChangePassword = fresh.mustChangePassword;
      }
      return token;
    },
  },
});
