import ExcelJS from "exceljs";
import { NextResponse, type NextRequest } from "next/server";
import { getActiveAdmin } from "@/lib/admin-guard";
import { fmtDateKey } from "@/lib/format";
import { parseRange } from "@/lib/report-params";
import { loadRecap } from "@/lib/report-service";

export const dynamic = "force-dynamic";

const HEADERS = [
  "No",
  "NIP",
  "Nama",
  "Jabatan/Dusun",
  "Total Hadir",
  "Total Terlambat (menit)",
  "Dinas Luar",
  "Izin/Sakit",
  "Alpha",
  "% Kehadiran",
];

export async function GET(req: NextRequest) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Dilarang" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const range = parseRange(
    sp.get("from") ?? undefined,
    sp.get("to") ?? undefined,
  );
  if (range.error)
    return NextResponse.json({ error: range.error }, { status: 400 });
  const recap = await loadRecap({
    from: range.from,
    to: range.to,
    locationId: sp.get("lokasi") || undefined,
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = "Sistem Presensi Kelurahan Patalan";
  const ws = wb.addWorksheet("Rekap");
  ws.mergeCells("A1:J1");
  ws.getCell("A1").value = "REKAPITULASI PRESENSI KELURAHAN PATALAN";
  ws.getCell("A1").font = { bold: true, size: 14 };
  ws.getCell("A1").alignment = { horizontal: "center" };
  ws.mergeCells("A2:J2");
  ws.getCell("A2").value =
    `Periode ${fmtDateKey(range.from)} s.d. ${fmtDateKey(range.to)}`;
  ws.getCell("A2").alignment = { horizontal: "center" };

  const header = ws.getRow(4);
  header.values = HEADERS;
  header.font = { bold: true };
  header.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
  header.eachCell((c) => {
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E7EB" },
    };
  });

  recap.rows.forEach((r, i) => {
    ws.addRow([
      i + 1,
      r.nip,
      r.name,
      r.position,
      r.hadir,
      r.lateMinutes,
      r.dinasLuar,
      r.izinSakit,
      r.alpha,
      r.percentage,
    ]);
  });
  const widths = [6, 22, 28, 26, 12, 16, 12, 12, 8, 14];
  widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));
  ws.getColumn(2).numFmt = "@";
  ws.getColumn(10).numFmt = '0.00"%"';
  for (let r = 4; r <= 4 + recap.rows.length; r++) {
    ws.getRow(r).eachCell((c) => {
      c.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }

  const notes = wb.addWorksheet("Catatan");
  notes.addRow(["NIP", "Nama", "Tanggal", "Keterangan"]).font = { bold: true };
  let any = false;
  for (const r of recap.rows) {
    for (const d of r.noClockOut) {
      any = true;
      notes.addRow([r.nip, r.name, fmtDateKey(d), "Tidak Clock Out"]);
    }
  }
  if (!any) notes.addRow(["Tidak ada catatan pada periode ini."]);
  [22, 28, 20, 20].forEach((w, i) => (notes.getColumn(i + 1).width = w));
  notes.getColumn(1).numFmt = "@";

  const buffer = await wb.xlsx.writeBuffer();
  return new Response(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="rekap-presensi_${range.from}_${range.to}.xlsx"`,
    },
  });
}
