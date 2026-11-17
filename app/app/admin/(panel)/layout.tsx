import { logoutAdmin } from "@/app/actions";
import { AdminNav } from "@/components/admin-nav";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  const pending = await db.attendance.count({
    where: { status: "PENDING_APPROVAL", type: "IN", category: "DINAS_LUAR" },
  });

  return (
    <div className="min-h-dvh md:flex">
      <AdminNav
        pending={pending}
        adminName={admin.name}
        logout={
          <form action={logoutAdmin}>
            <Button type="submit" variant="outline" size="sm">
              Keluar
            </Button>
          </form>
        }
      />
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
