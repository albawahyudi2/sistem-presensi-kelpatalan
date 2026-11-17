export const MIN_PASSWORD_LENGTH = 10;

export type PasswordCheck = { ok: true } | { ok: false; message: string };

const COMMON_FRAGMENTS = [
  "password",
  "passw0rd",
  "qwerty",
  "asdfgh",
  "zxcvbn",
  "iloveyou",
  "letmein",
  "welcome",
  "admin",
  "12345",
  "54321",
  "patalan",
  "kelurahan",
  "presensi",
  "bantul",
];

function isSequential(s: string): boolean {
  if (s.length < 2) return false;
  const step = s.charCodeAt(1) - s.charCodeAt(0);
  if (Math.abs(step) !== 1) return false;
  for (let i = 1; i < s.length; i++) {
    if (s.charCodeAt(i) - s.charCodeAt(i - 1) !== step) return false;
  }
  return true;
}

export function validateNewPassword(
  newPassword: string,
  initialPassword: string,
): PasswordCheck {
  const lower = newPassword.toLowerCase();

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter.`,
    };
  }
  if (newPassword === initialPassword) {
    return {
      ok: false,
      message: "Password baru tidak boleh sama dengan password awal.",
    };
  }
  if (
    initialPassword.length >= 6 &&
    lower.includes(initialPassword.toLowerCase())
  ) {
    return {
      ok: false,
      message: "Password baru tidak boleh mengandung NIP atau password awal.",
    };
  }
  if (new Set(lower).size < 4 || isSequential(lower)) {
    return {
      ok: false,
      message:
        "Password terlalu mudah ditebak (karakter berulang atau berurutan).",
    };
  }
  if (COMMON_FRAGMENTS.some((w) => lower.includes(w))) {
    return {
      ok: false,
      message:
        "Password terlalu umum. Gunakan kombinasi yang tidak mudah ditebak.",
    };
  }
  return { ok: true };
}
