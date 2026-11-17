"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { submitAttendance } from "@/app/attendance-actions";
import { Button } from "@/components/ui/button";
import { getGpsFix, type GpsFix } from "@/lib/client-geo";
import { uploadToCloudinary } from "@/lib/client-upload";
import { enqueueAttendance, isNetworkError } from "@/lib/offline-queue";

type Step = "locating" | "camera" | "preview" | "sending";
type Props = {
  userId: string;
  nip: string;
  category: "HADIR" | "DINAS_LUAR";
  onDone: (message: { ok: boolean; message: string }) => void;
  onCancel: () => void;
};

const TZ = "Asia/Jakarta";

function isSlowNetwork(): boolean {
  const c = (
    navigator as unknown as {
      connection?: { effectiveType?: string; saveData?: boolean };
    }
  ).connection;
  return (
    Boolean(c?.saveData) ||
    ["slow-2g", "2g", "3g"].includes(c?.effectiveType ?? "")
  );
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function buildPhoto(
  video: HTMLVideoElement,
  nip: string,
  fix: GpsFix,
): Promise<Blob> {
  const slow = isSlowNetwork();
  const maxSide = slow ? 640 : 960;
  const scale = Math.min(
    1,
    maxSide / Math.max(video.videoWidth, video.videoHeight),
  );
  const w = Math.round(video.videoWidth * scale);
  const h = Math.round(video.videoHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Gagal memproses foto.");
  ctx.drawImage(video, 0, 0, w, h);

  const now = new Date();
  const stamp = new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    dateStyle: "short",
    timeStyle: "medium",
    hour12: false,
  }).format(now);
  const hash = (
    await sha256Hex(
      `${nip}|${fix.latitude}|${fix.longitude}|${now.toISOString()}`,
    )
  ).slice(0, 12);
  const lines = [
    `${stamp} WIB`,
    `${fix.latitude.toFixed(6)}, ${fix.longitude.toFixed(6)}`,
    `NIP ${nip} · ${hash}`,
  ];

  const fontSize = Math.max(12, Math.round(w / 28));
  const pad = Math.round(fontSize * 0.6);
  const boxH = lines.length * (fontSize + 4) + pad * 2;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, h - boxH, w, boxH);
  ctx.fillStyle = "#fff";
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textBaseline = "top";
  lines.forEach((line, i) =>
    ctx.fillText(line, pad, h - boxH + pad + i * (fontSize + 4)),
  );

  const quality = slow ? 0.5 : 0.8;
  const toBlob = (type: string) =>
    new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality));
  const webp = await toBlob("image/webp");
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await toBlob("image/jpeg");
  if (!jpeg) throw new Error("Gagal memproses foto.");
  return jpeg;
}

export function ClockInFlow({
  userId,
  nip,
  category,
  onDone,
  onCancel,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<Step>("locating");
  const [fix, setFix] = useState<GpsFix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: category === "HADIR" ? "user" : "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setStep("camera");
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setError(
        "Kamera tidak dapat dibuka. Izinkan akses kamera lalu coba lagi.",
      );
    }
  }

  async function acquire() {
    try {
      setFix(await getGpsFix());
      await startCamera();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function retryLocate() {
    setError(null);
    setStep("locating");
    void acquire();
  }

  useEffect(() => {
    // GPS dan kamera adalah sistem eksternal; akuisisi dimulai saat komponen tampil.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void acquire();
    return stopCamera;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previewUrl = useMemo(
    () => (blob ? URL.createObjectURL(blob) : null),
    [blob],
  );
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function capture() {
    if (!videoRef.current || !fix) return;
    try {
      setBlob(await buildPhoto(videoRef.current, nip, fix));
      stopCamera();
      setStep("preview");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function retake() {
    setBlob(null);
    await startCamera();
  }

  async function send() {
    if (!blob || !fix) return;
    if (category === "DINAS_LUAR" && !notes.trim()) {
      setError("Catatan tugas wajib diisi.");
      return;
    }
    setError(null);
    setStep("sending");
    const payload = {
      type: "IN" as const,
      category,
      latitude: fix.latitude,
      longitude: fix.longitude,
      accuracy: fix.accuracy,
      notes: category === "DINAS_LUAR" ? notes.trim() : null,
      capturedAt: new Date().toISOString(),
      idempotencyKey: crypto.randomUUID(),
    };
    try {
      const photoUrl = await uploadToCloudinary(blob);
      onDone(
        await submitAttendance({ ...payload, photoUrl, isOfflineSync: false }),
      );
    } catch (e) {
      if (isNetworkError(e)) {
        await enqueueAttendance(userId, { ...payload, photoUrl: null }, blob);
        onDone({
          ok: true,
          message:
            "Tidak ada koneksi. Presensi tersimpan di perangkat dan akan dikirim otomatis saat online.",
        });
        return;
      }
      setError((e as Error).message);
      setStep("preview");
    }
  }

  const title = category === "HADIR" ? "Presensi Masuk" : "Presensi Dinas Luar";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={step === "sending"}
        >
          Batal
        </Button>
      </div>

      {step === "locating" && !error && (
        <p className="text-muted-foreground text-sm">Mencari lokasi GPS...</p>
      )}

      {step === "camera" && (
        <div className="space-y-3">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-3xl bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`h-full w-full object-cover ${category === "HADIR" ? "-scale-x-100" : ""}`}
            />
            {category === "HADIR" && (
              <div className="pointer-events-none absolute inset-x-[12%] inset-y-[8%] rounded-[50%] border-4 border-white/80" />
            )}
          </div>
          <p className="text-muted-foreground text-center text-xs">
            {category === "HADIR"
              ? "Posisikan wajah di dalam bingkai, kenakan busana dinas."
              : "Foto kegiatan dinas luar."}
          </p>
          <Button className="w-full" onClick={capture}>
            Ambil Foto
          </Button>
        </div>
      )}

      {(step === "preview" || step === "sending") && previewUrl && (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Pratinjau foto presensi"
            className="mx-auto w-full max-w-xs rounded-3xl"
          />
          {category === "DINAS_LUAR" && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tugas (wajib)"
              rows={3}
              maxLength={500}
              className="border-input w-full rounded-xl border bg-transparent p-3 text-sm"
            />
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={retake}
              disabled={step === "sending"}
            >
              Ulangi
            </Button>
            <Button
              className="flex-1"
              onClick={send}
              disabled={step === "sending"}
            >
              {step === "sending" ? "Mengirim..." : "Kirim Presensi"}
            </Button>
          </div>
          {blob && (
            <p className="text-muted-foreground text-center text-xs">
              Ukuran foto {(blob.size / 1024).toFixed(0)} KB
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="space-y-2">
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
          {step === "locating" && (
            <Button variant="outline" onClick={retryLocate}>
              Coba lagi
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
