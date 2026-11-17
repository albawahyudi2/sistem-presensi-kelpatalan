import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getActiveAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  const admin = await db.admin.findUnique({ where: { id: session.user.id } });
  return admin?.isActive ? admin : null;
}

export async function requireAdmin() {
  const admin = await getActiveAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export function back(
  path: string,
  kind: "ok" | "error",
  message: string,
): never {
  redirect(`${path}?${kind}=${encodeURIComponent(message)}`);
}

export function backWith(
  path: string,
  kind: "ok" | "error",
  message: string,
  extra: Record<string, string | string[]>,
): never {
  const params = new URLSearchParams();
  params.set(kind, message);
  for (const [key, value] of Object.entries(extra)) {
    for (const v of Array.isArray(value) ? value : [value])
      params.append(key, v);
  }
  redirect(`${path}?${params.toString()}`);
}
