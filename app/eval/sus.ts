import { readFileSync } from "node:fs";
import { susScore, susSummary } from "../lib/eval-metrics";

const file = process.argv[2] ?? "eval/sus-responses.csv";
const lines = readFileSync(file, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));
const [, ...data] = lines;

const scores: number[] = [];
console.log(`Berkas: ${file}  (${data.length} responden)\n`);
console.log("responden | peran | skor SUS");
for (const line of data) {
  const c = line.split(",").map((x) => x.trim());
  const answers = c.slice(2, 12).map(Number);
  const score = susScore(answers);
  scores.push(score);
  console.log(`${c[0]} | ${c[1]} | ${score.toFixed(1)}`);
}

const s = susSummary(scores);
console.log(`\nJumlah responden : ${s.n}`);
console.log(
  `Skor SUS rata-rata: ${s.mean.toFixed(2)}  (SD ${s.sd.toFixed(2)}, min ${s.min}, maks ${s.max})`,
);
console.log(
  `Di atas rata-rata industri (68): ${s.aboveAverage ? "ya" : "tidak"}`,
);
console.log(`Kategori penerimaan: ${s.acceptability}`);
if (data.some((l) => l.startsWith("contoh"))) {
  console.log(
    "\nPERINGATAN: berkas masih berisi baris 'contoh-*'. Ganti dengan jawaban responden nyata.",
  );
}
if (s.n !== 15) console.log(`CATATAN: rencana 15 responden, saat ini ${s.n}.`);
