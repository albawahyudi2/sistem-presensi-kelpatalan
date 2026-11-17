export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-3xl border border-black/10 bg-white/60 p-6 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
        <header className="space-y-1 text-center">
          <p className="text-xs font-semibold tracking-wide text-blue-600 uppercase">
            Kelurahan Patalan
          </p>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm opacity-70">{subtitle}</p>
        </header>
        {children}
      </div>
    </main>
  );
}
