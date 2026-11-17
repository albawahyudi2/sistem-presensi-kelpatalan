"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth, signIn, signOut, unstable_update } from "@/auth";
import { db } from "@/lib/db";
import { validateNewPassword } from "@/lib/password";

export type FormState = { error?: string; identifier?: string };

async function login(
  provider: "pegawai" | "admin",
  redirectTo: string,
  formData: FormData,
): Promise<FormState> {
  const identifier = String(formData.get("identifier") ?? "");
  try {
    await signIn(provider, {
      identifier,
      password: String(formData.get("password") ?? ""),
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const code = (error as { code?: string }).code;
      if (code === "rate_limited") {
        return {
          identifier,
          error: "Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.",
        };
      }
      return { identifier, error: "NIP/username atau password salah." };
    }
    throw error;
  }
  return {};
}

export async function loginPegawai(_: FormState, formData: FormData) {
  return login("pegawai", "/", formData);
}

export async function loginAdmin(_: FormState, formData: FormData) {
  return login("admin", "/admin/dashboard", formData);
}

export async function logoutPegawai() {
  await signOut({ redirectTo: "/login" });
}

export async function logoutAdmin() {
  await signOut({ redirectTo: "/admin/login" });
}

const changePasswordSchema = z.object({
  newPassword: z.string().min(1).max(128),
  confirmPassword: z.string().min(1).max(128),
});

export async function changePassword(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = changePasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: "Lengkapi semua isian." };
  const { newPassword, confirmPassword } = parsed.data;
  if (newPassword !== confirmPassword) {
    return { error: "Konfirmasi password tidak sama." };
  }

  const isAdmin = session.user.role === "ADMIN";
  const account = isAdmin
    ? await db.admin.findUnique({ where: { id: session.user.id } })
    : await db.user.findUnique({ where: { id: session.user.id } });
  if (!account) redirect(isAdmin ? "/admin/login" : "/login");

  const initial = "nip" in account ? account.nip : "";
  const check = validateNewPassword(newPassword, initial);
  if (!check.ok) return { error: check.message };
  if (await bcrypt.compare(newPassword, account.passwordHash)) {
    return { error: "Password baru tidak boleh sama dengan password lama." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const data = { passwordHash, mustChangePassword: false };
  if (isAdmin) {
    await db.admin.update({ where: { id: account.id }, data });
  } else {
    await db.user.update({ where: { id: account.id }, data });
  }

  await unstable_update({});
  redirect(isAdmin ? "/admin/dashboard" : "/");
}
