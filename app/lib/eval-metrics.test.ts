import { describe, expect, it } from "vitest";
import {
  classificationMetrics,
  confusionMatrix,
  susScore,
  susSummary,
} from "./eval-metrics";

describe("confusion matrix", () => {
  it("menghitung TP, FP, TN, FN", () => {
    const c = confusionMatrix([
      { expected: true, predicted: true },
      { expected: true, predicted: true },
      { expected: true, predicted: false },
      { expected: false, predicted: true },
      { expected: false, predicted: false },
      { expected: false, predicted: false },
    ]);
    expect(c).toEqual({ tp: 2, fp: 1, tn: 2, fn: 1 });
  });

  it("accuracy, precision, recall, F1", () => {
    const m = classificationMetrics({ tp: 2, fp: 1, tn: 2, fn: 1 });
    expect(m.accuracy).toBeCloseTo(4 / 6);
    expect(m.precision).toBeCloseTo(2 / 3);
    expect(m.recall).toBeCloseTo(2 / 3);
    expect(m.f1).toBeCloseTo(2 / 3);
  });

  it("pembagi nol menghasilkan null, bukan NaN", () => {
    const m = classificationMetrics({ tp: 0, fp: 0, tn: 5, fn: 0 });
    expect(m.precision).toBeNull();
    expect(m.recall).toBeNull();
    expect(m.f1).toBeNull();
    expect(m.accuracy).toBe(1);
  });
});

describe("SUS", () => {
  it("skor 100 untuk jawaban terbaik (ganjil 5, genap 1)", () => {
    expect(susScore([5, 1, 5, 1, 5, 1, 5, 1, 5, 1])).toBe(100);
  });
  it("skor 0 untuk jawaban terburuk", () => {
    expect(susScore([1, 5, 1, 5, 1, 5, 1, 5, 1, 5])).toBe(0);
  });
  it("semua netral (3) = 50", () => {
    expect(susScore(Array(10).fill(3))).toBe(50);
  });
  it("contoh hitung manual", () => {
    // ganjil: 4,4,5,3,4 -> 3+3+4+2+3=15; genap: 2,1,2,2,1 -> 3+4+3+3+4=17; (15+17)*2.5=80
    expect(susScore([4, 2, 4, 1, 5, 2, 3, 2, 4, 1])).toBe(80);
  });
  it("menolak jumlah atau nilai tidak valid", () => {
    expect(() => susScore([1, 2, 3])).toThrow();
    expect(() => susScore([6, 1, 1, 1, 1, 1, 1, 1, 1, 1])).toThrow();
  });
  it("ringkasan: rata-rata, simpangan baku, kategori", () => {
    const s = susSummary([80, 70, 90]);
    expect(s.mean).toBeCloseTo(80);
    expect(s.sd).toBeCloseTo(10);
    expect(s.aboveAverage).toBe(true);
    expect(s.acceptability).toBe("Dapat diterima");
    expect(susSummary([40, 45]).acceptability).toBe("Tidak dapat diterima");
  });
});
