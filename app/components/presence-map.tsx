"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

export type MapLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
};
export type MapPin = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  time: string;
  label: string;
  late: boolean;
};

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 16);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 17 });
  }, [map, points]);
  return null;
}

export default function PresenceMap({
  locations,
  pins,
}: {
  locations: MapLocation[];
  pins: MapPin[];
}) {
  const first = locations[0];
  const center: [number, number] = first
    ? [first.latitude, first.longitude]
    : [-7.9285979, 110.349427];
  const points = useMemo<[number, number][]>(
    () => [
      ...locations.map((l): [number, number] => [l.latitude, l.longitude]),
      ...pins.map((p): [number, number] => [p.latitude, p.longitude]),
    ],
    [locations, pins],
  );

  return (
    <MapContainer
      center={center}
      zoom={16}
      scrollWheelZoom
      className="h-[70vh] w-full rounded-xl"
    >
      <FitBounds points={points} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((l) => (
        <Circle
          key={l.id}
          center={[l.latitude, l.longitude]}
          radius={l.radius}
          pathOptions={{ color: "#2563eb", fillOpacity: 0.12 }}
        >
          <Popup>
            <strong>{l.name}</strong>
            <br />
            Radius {l.radius} m
          </Popup>
        </Circle>
      ))}
      {pins.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.latitude, p.longitude]}
          radius={8}
          pathOptions={{
            color: "#fff",
            weight: 2,
            fillColor: p.late ? "#dc2626" : "#16a34a",
            fillOpacity: 1,
          }}
        >
          <Popup>
            <strong>{p.name}</strong>
            <br />
            {p.time} WIB · {p.label}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
