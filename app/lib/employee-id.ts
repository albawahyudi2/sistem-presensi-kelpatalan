export type IdCheck = { ok: true } | { ok: false; message: string };

export function validateEmployeeId(raw: string): IdCheck {
  const id = raw.trim();
  if (/^\d+$/.test(id)) {
    return id.length === 18
      ? { ok: true }
      : {
          ok: false,
          message: `NIP harus 18 digit angka (terisi ${id.length} digit). Periksa kembali. Pegawai non-PNS memakai ID 4-30 huruf/angka yang memuat huruf.`,
        };
  }
  if (/^[A-Za-z0-9]{4,30}$/.test(id)) return { ok: true };
  return {
    ok: false,
    message:
      "ID tidak valid. Gunakan NIP 18 digit angka, atau ID non-PNS 4-30 huruf/angka yang memuat huruf.",
  };
}
