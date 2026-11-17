export type Confusion = { tp: number; fp: number; tn: number; fn: number };

export function confusionMatrix(
  rows: { expected: boolean; predicted: boolean }[],
): Confusion {
  const c: Confusion = { tp: 0, fp: 0, tn: 0, fn: 0 };
  for (const r of rows) {
    if (r.expected && r.predicted) c.tp++;
    else if (!r.expected && r.predicted) c.fp++;
    else if (!r.expected && !r.predicted) c.tn++;
    else c.fn++;
  }
  return c;
}

const ratio = (a: number, b: number) => (b === 0 ? null : a / b);

export function classificationMetrics(c: Confusion) {
  const n = c.tp + c.fp + c.tn + c.fn;
  const precision = ratio(c.tp, c.tp + c.fp);
  const recall = ratio(c.tp, c.tp + c.fn);
  const f1 =
    precision === null || recall === null || precision + recall === 0
      ? null
      : (2 * precision * recall) / (precision + recall);
  return { n, accuracy: ratio(c.tp + c.tn, n), precision, recall, f1 };
}

// SUS: item ganjil (1,3,5,7,9) = skor-1; item genap (2,4,6,8,10) = 5-skor; jumlah x 2,5.
export function susScore(answers: number[]): number {
  if (
    answers.length !== 10 ||
    answers.some((a) => !Number.isInteger(a) || a < 1 || a > 5)
  ) {
    throw new Error("SUS membutuhkan 10 jawaban bernilai 1-5.");
  }
  const sum = answers.reduce((t, a, i) => t + (i % 2 === 0 ? a - 1 : 5 - a), 0);
  return sum * 2.5;
}

export function susSummary(scores: number[]) {
  const n = scores.length;
  const mean = n === 0 ? 0 : scores.reduce((a, b) => a + b, 0) / n;
  const variance =
    n < 2 ? 0 : scores.reduce((t, s) => t + (s - mean) ** 2, 0) / (n - 1);
  const acceptability =
    mean > 70
      ? "Dapat diterima"
      : mean >= 50
        ? "Marginal"
        : "Tidak dapat diterima";
  return {
    n,
    mean,
    sd: Math.sqrt(variance),
    min: n ? Math.min(...scores) : 0,
    max: n ? Math.max(...scores) : 0,
    aboveAverage: mean >= 68,
    acceptability,
  };
}
