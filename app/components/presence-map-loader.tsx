"use client";

import dynamic from "next/dynamic";
import type { MapLocation, MapPin } from "@/components/presence-map";

const PresenceMap = dynamic(() => import("@/components/presence-map"), {
  ssr: false,
  loading: () => (
    <div className="bg-muted h-[70vh] w-full animate-pulse rounded-xl" />
  ),
});

export function PresenceMapLoader(props: {
  locations: MapLocation[];
  pins: MapPin[];
}) {
  return <PresenceMap {...props} />;
}
