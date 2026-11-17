"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/verifikasi", label: "Verifikasi Dinas Luar" },
  { href: "/admin/foto", label: "Audit Foto" },
  { href: "/admin/peta", label: "Live Map" },
  { href: "/admin/laporan", label: "Laporan" },
  { href: "/admin/pegawai", label: "Pegawai" },
  { href: "/admin/lokasi", label: "Lokasi" },
  { href: "/admin/libur", label: "Hari Libur" },
  { href: "/admin/izin", label: "Izin / Sakit" },
];

export function AdminNav({
  pending,
  adminName,
  logout,
}: {
  pending: number;
  adminName: string;
  logout: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <aside className="md:w-60 md:shrink-0 md:border-r">
      <div className="flex items-center justify-between border-b p-4 md:block md:border-b-0 md:pb-0">
        <div>
          <p className="text-primary text-xs font-semibold tracking-wide uppercase">
            Kelurahan Patalan
          </p>
          <p className="font-bold">Admin Presensi</p>
        </div>
        <button
          type="button"
          aria-label="Buka menu"
          aria-expanded={open}
          aria-controls="admin-menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border p-2 md:hidden"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      <div
        id="admin-menu"
        className={`${open ? "block" : "hidden"} border-b p-4 md:block md:border-b-0`}
      >
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-muted font-semibold" : "hover:bg-muted"
                }`}
              >
                {n.label}
                {n.href === "/admin/verifikasi" && pending > 0 && (
                  <span className="bg-destructive ml-2 rounded-full px-2 py-0.5 text-xs text-white">
                    {pending}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 space-y-2 border-t pt-4">
          <p className="text-muted-foreground text-xs">{adminName}</p>
          {logout}
        </div>
      </div>
    </aside>
  );
}
