"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitAttendance } from "@/app/attendance-actions";
import { ClockInFlow } from "@/components/clock-in-flow";
import { ConfirmModal } from "@/components/confirm";
import { Button } from "@/components/ui/button";
import { getGpsFix } from "@/lib/client-geo";
import { enqueueAttendance, isNetworkError } from "@/lib/offline-queue";

type Props = {
  userId: string;
  nip: string;
  hasIn: boolean;
  hasOut: boolean;
  isWorkday: boolean;
  hasLocations: boolean;
};

export function AttendancePanel({
  userId,
  nip,
  hasIn,
  hasOut,
  isWorkday,
  hasLocations,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "HADIR" | "DINAS_LUAR">("idle");
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const [confirmOut, setConfirmOut] = useState(false);

  function finish(r: { ok: boolean; message: string }) {
    setNotice(r);
    setMode("idle");
    router.refresh();
  }

  function clockOut() {
    setNotice(null);
    startTransition(async () => {
      let fix;
      try {
        fix = await getGpsFix();
      } catch (e) {
        setNotice({ ok: false, message: (e as Error).message });
        return;
      }
      const payload = {
        type: "OUT" as const,
        category: "HADIR" as const,
        latitude: fix.latitude,
        longitude: fix.longitude,
        accuracy: fix.accuracy,
        photoUrl: null,
        notes: null,
        capturedAt: new Date().toISOString(),
        idempotencyKey: crypto.randomUUID(),
      };
      try {
        finish(await submitAttendance({ ...payload, isOfflineSync: false }));
      } catch (e) {
        if (isNetworkError(e)) {
          await enqueueAttendance(userId, payload);
          finish({
            ok: true,
            message:
              "Tidak ada koneksi. Presensi pulang tersimpan di perangkat dan akan dikirim otomatis saat online.",
          });
        } else {
          setNotice({ ok: false, message: (e as Error).message });
        }
      }
    });
  }

  if (mode !== "idle") {
    return (
      <ClockInFlow
        userId={userId}
        nip={nip}
        category={mode}
        onDone={finish}
        onCancel={() => setMode("idle")}
      />
    );
  }

  return (
    <div className="space-y-3">
      {!isWorkday && (
        <p className="text-muted-foreground text-sm">
          Hari ini bukan hari kerja (akhir pekan atau libur).
        </p>
      )}
      {!hasLocations && (
        <p className="text-destructive text-sm">
          Anda belum memiliki lokasi penugasan. Hubungi admin.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Button
          size="lg"
          disabled={hasIn || !isWorkday || pending}
          onClick={() => {
            setNotice(null);
            setMode("HADIR");
          }}
        >
          Absen Masuk
        </Button>
        <Button
          size="lg"
          variant="secondary"
          disabled={!hasIn || hasOut || !isWorkday || pending}
          onClick={() => setConfirmOut(true)}
        >
          {pending ? "Memproses..." : "Absen Pulang"}
        </Button>
      </div>
      <Button
        variant="outline"
        className="w-full"
        disabled={hasIn || !isWorkday || pending}
        onClick={() => {
          setNotice(null);
          setMode("DINAS_LUAR");
        }}
      >
        Dinas Luar
      </Button>
      <ConfirmModal
        open={confirmOut}
        title="Absen pulang sekarang?"
        message="Presensi pulang dicatat dengan lokasi Anda saat ini dan tidak dapat diubah atau diulang."
        confirmLabel="Ya, absen pulang"
        destructive={false}
        onCancel={() => setConfirmOut(false)}
        onConfirm={() => {
          setConfirmOut(false);
          clockOut();
        }}
      />
      {notice && (
        <p
          role="status"
          className={`text-sm ${notice.ok ? "text-green-600" : "text-destructive"}`}
        >
          {notice.message}
        </p>
      )}
    </div>
  );
}
