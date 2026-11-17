"use client";

import { useEffect, useState } from "react";

const TZ = "Asia/Jakarta";

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  if (!now) return <div className="h-24" aria-hidden />;

  const time = new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(now)
    .replaceAll(".", ":");
  const date = new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <div>
      <p className="text-5xl font-bold tracking-tight tabular-nums">{time}</p>
      <p className="text-muted-foreground mt-1 text-sm">{date} · WIB</p>
    </div>
  );
}
