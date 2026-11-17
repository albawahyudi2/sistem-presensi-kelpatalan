export const field =
  "w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50";
export const btn =
  "inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground";
export const btnGhost =
  "inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium";
export const btnDanger =
  "inline-flex items-center justify-center rounded-lg border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive";
export const th =
  "px-3 py-2 text-left text-xs font-medium text-muted-foreground";
export const td = "px-3 py-2 text-sm align-top";

export function PageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-6 space-y-1">
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
    </header>
  );
}

export function Banner({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
        error
          ? "border-destructive/40 text-destructive"
          : "border-green-600/40 text-green-700"
      }`}
    >
      {error ?? ok}
    </p>
  );
}

export type Flash = Promise<{ ok?: string; error?: string }>;

export function EmptyState({
  title,
  hint,
  href,
  hrefLabel,
}: {
  title: string;
  hint: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-dashed p-6 text-center">
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground text-sm">{hint}</p>
      {href && hrefLabel && (
        <a href={href} className={btnGhost}>
          {hrefLabel}
        </a>
      )}
    </div>
  );
}
