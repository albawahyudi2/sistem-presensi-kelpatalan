"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { submitAttendance } from "@/app/attendance-actions";
import { Button } from "@/components/ui/button";
import { uploadToCloudinary } from "@/lib/client-upload";
import { pendingCount, syncQueue } from "@/lib/offline-queue";

export function OfflineSync({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setPending(await pendingCount(userId));
      return;
    }
    setBusy(true);
    try {
      const s = await syncQueue(userId, {
        upload: uploadToCloudinary,
        submit: (p) => submitAttendance(p),
      });
      setPending(s.remaining);
      if (s.sent > 0 || s.rejected.length > 0) {
        const parts = [];
        if (s.sent > 0) parts.push(`${s.sent} presensi offline terkirim.`);
        parts.push(...s.rejected.map((m) => `Ditolak: ${m}`));
        setMessage(parts.join(" "));
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }, [userId, router]);

  useEffect(() => {
    const first = setTimeout(run, 0);
    const onVisible = () => {
      if (document.visibilityState === "visible") void run();
    };
    window.addEventListener("online", run);
    document.addEventListener("visibilitychange", onVisible);
    const id = setInterval(run, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      window.removeEventListener("online", run);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [run]);

  if (pending === 0 && !message) return null;

  return (
    <div
      role="status"
      className="space-y-2 rounded-xl border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-950"
    >
      {pending > 0 && (
        <p>
          {pending} presensi menunggu sinkronisasi. Buka aplikasi saat ada
          sinyal agar terkirim.
        </p>
      )}
      {message && <p>{message}</p>}
      {pending > 0 && (
        <Button size="sm" variant="outline" onClick={run} disabled={busy}>
          {busy ? "Mengirim..." : "Kirim sekarang"}
        </Button>
      )}
    </div>
  );
}
