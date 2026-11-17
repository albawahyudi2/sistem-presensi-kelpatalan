import { readFileSync } from "node:fs";
import { checkGeofence, haversineMeters } from "../lib/geo";
import { classificationMetrics, confusionMatrix } from "../lib/eval-metrics";

const file = process.argv[2] ?? "eval/geo-points.csv";
const lines = readFileSync(file, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));
const [header, ...data] = lines;
const cols = header.split(",").map((c) => c.trim());
const idx = (name: string) => {
  const i = cols.indexOf(name);
  if (i < 0) throw new Error(`Kolom "${name}" tidak ada di ${file}`);
  return i;
};

const rows = data.map((line) => {
  const c = line.split(",").map((x) => x.trim());
  const accuracy = c[idx("akurasi_gps_m")];
  const expected = c[idx("ekspektasi")].toUpperCase();
  if (expected !== "DALAM" && expected !== "LUAR") {
    throw new Error(`Ekspektasi harus DALAM atau LUAR (baris ${c[idx("id")]})`);
  }
  const location = {
    id: "lokasi",
    name: "lokasi",
    latitude: Number(c[idx("lokasi_lat")]),
    longitude: Number(c[idx("lokasi_lon")]),
    radius: Number(c[idx("radius_m")]),
  };
  const point = {
    latitude: Number(c[idx("latitude")]),
    longitude: Number(c[idx("longitude")]),
  };
  const result = checkGeofence(
    point,
    accuracy === "" ? null : Number(accuracy),
    [location],
  );
  return {
    id: c[idx("id")],
    note: c[idx("keterangan")],
    distance: haversineMeters(point, location),
    radius: location.radius,
    expected: expected === "DALAM",
    predicted: result.ok,
    reason: result.ok ? "-" : result.reason,
  };
});

console.log(`Berkas: ${file}  (${rows.length} titik)\n`);
console.log(
  "id | jarak (m) | radius | ekspektasi | prediksi | status | catatan",
);
for (const r of rows) {
  const ok = r.expected === r.predicted;
  console.log(
    `${r.id} | ${r.distance.toFixed(1)} | ${r.radius} | ${r.expected ? "DALAM" : "LUAR"} | ${r.predicted ? "DALAM" : "LUAR"} | ${ok ? "benar" : "SALAH (" + r.reason + ")"} | ${r.note}`,
  );
}

const c = confusionMatrix(rows);
const m = classificationMetrics(c);
const pct = (v: number | null) =>
  v === null ? "n/a" : `${(v * 100).toFixed(2)}%`;
console.log("\nConfusion Matrix (positif = DALAM radius)");
console.log("                 Prediksi DALAM | Prediksi LUAR");
console.log(`Aktual DALAM     TP = ${c.tp}        | FN = ${c.fn}`);
console.log(`Aktual LUAR      FP = ${c.fp}        | TN = ${c.tn}`);
console.log(`\nAccuracy  : ${pct(m.accuracy)}`);
console.log(`Precision : ${pct(m.precision)}`);
console.log(`Recall    : ${pct(m.recall)}`);
console.log(`F1-score  : ${pct(m.f1)}`);
if (rows.some((r) => r.id.startsWith("contoh"))) {
  console.log(
    "\nPERINGATAN: berkas masih berisi baris 'contoh-*'. Ganti dengan data pengukuran nyata.",
  );
}
if (rows.length !== 20) {
  console.log(`CATATAN: rencana pengujian 20 titik, saat ini ${rows.length}.`);
}
