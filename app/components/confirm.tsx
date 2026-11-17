"use client";

import { useEffect, useRef, useState } from "react";

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Ya, lanjutkan",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="bg-background text-foreground m-auto w-[min(92vw,24rem)] rounded-2xl border p-6 shadow-xl backdrop:bg-black/50"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-2 text-sm">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            destructive
              ? "bg-destructive text-white"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

export function ConfirmButton({
  title,
  message,
  confirmLabel,
  destructive = true,
  className,
  children,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={(e) => {
          formRef.current = e.currentTarget.form;
          setOpen(true);
        }}
      >
        {children}
      </button>
      <ConfirmModal
        open={open}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        destructive={destructive}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
