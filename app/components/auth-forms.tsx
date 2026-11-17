"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const inputClass =
  "w-full rounded-xl border border-black/15 bg-white/70 px-4 py-3 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30 dark:border-white/20 dark:bg-white/10";
const buttonClass =
  "w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white disabled:opacity-60";

export function LoginForm({
  action,
  identifierLabel,
}: {
  action: Action;
  identifierLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-1 text-sm font-medium">
        {identifierLabel}
        <input
          name="identifier"
          required
          defaultValue={state.identifier}
          autoComplete="username"
          inputMode="text"
          className={inputClass}
        />
      </label>
      <label className="block space-y-1 text-sm font-medium">
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}

export function ChangePasswordForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-1 text-sm font-medium">
        Password baru (minimal 10 karakter)
        <input
          name="newPassword"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className={inputClass}
        />
      </label>
      <label className="block space-y-1 text-sm font-medium">
        Ulangi password baru
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className={inputClass}
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Menyimpan..." : "Simpan Password"}
      </button>
    </form>
  );
}
